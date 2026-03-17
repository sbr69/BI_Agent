"""
API Routes -- endpoints for querying, datasets, upload, and health.
"""

import os
import re
import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from api.models import (
    QueryRequest, QueryResponse, ChartConfig,
    DatasetsResponse, DatasetInfo, ColumnInfo,
    UploadResponse, HealthResponse
)
from core.query_engine import query_engine
from core.schema import get_schema_description, get_datasets_info
from core.llm import get_llm_client
from core.prompts import get_system_prompt, get_followup_prompt

router = APIRouter(prefix="/api")

# In-memory session store for conversation context
_sessions: dict[str, list[dict]] = {}

# Constraints
MAX_SESSIONS = 1000
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
_SESSION_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
_SAFE_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_\- ]+\.csv$")


def _validate_session_id(session_id: str) -> str:
    """Validate and return a safe session ID."""
    if not _SESSION_ID_RE.match(session_id):
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    return session_id


# ---------------------------------------------------------------------------
# All route handlers are sync (def, not async def) because they call blocking
# psycopg2 / Groq SDK methods.  FastAPI automatically dispatches sync handlers
# to a thread-pool so the event loop stays unblocked.
# ---------------------------------------------------------------------------


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    tables = query_engine.get_table_names()
    total_rows = sum(query_engine.get_row_count(t) for t in tables)
    return HealthResponse(
        status="ok",
        tables_loaded=len(tables),
        total_rows=total_rows
    )


@router.get("/datasets", response_model=DatasetsResponse)
def list_datasets():
    """List all available datasets with schema info."""
    datasets = get_datasets_info()
    return DatasetsResponse(
        datasets=[
            DatasetInfo(
                name=d["name"],
                row_count=d["row_count"],
                columns=[ColumnInfo(**c) for c in d["columns"]]
            )
            for d in datasets
        ]
    )


@router.post("/query", response_model=QueryResponse)
def process_query(request: QueryRequest):
    """Process a natural language query and return chart data."""
    start_time = time.time()

    # Determine which dataset to use
    tables = query_engine.get_table_names()
    if not tables:
        raise HTTPException(status_code=400, detail="No datasets loaded")

    target_table = request.dataset or tables[0]
    if target_table not in tables:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{target_table}' not found. Available: {tables}"
        )

    # Build schema context
    schema = get_schema_description(target_table)

    # Validate session ID
    session_id = _validate_session_id(request.session_id) if request.session_id else "default"
    history = _sessions.get(session_id, [])

    # Build prompt
    if history:
        system_prompt = get_followup_prompt(schema, history)
    else:
        system_prompt = get_system_prompt(schema)

    # Call LLM
    try:
        llm = get_llm_client()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    llm_response = llm.generate(system_prompt, request.prompt)

    # If LLM returned an error, pass it through
    if llm_response.get("error"):
        return QueryResponse(
            error=llm_response["error"],
            metadata={
                "query_time_ms": int((time.time() - start_time) * 1000),
                "dataset": target_table
            }
        )

    # Execute SQL queries and attach data to charts
    charts = []
    query_results = []

    for q in llm_response.get("sql_queries", []):
        try:
            result = query_engine.execute_query(q["sql"])
            query_results.append(result)
        except ValueError as e:
            query_results.append([])
            llm_response.setdefault("insights", []).append(f"Query error: {str(e)}")

    for chart_config in llm_response.get("charts", []):
        sql_idx = chart_config.get("sql_index", 0)
        data = query_results[sql_idx] if sql_idx < len(query_results) else []

        if data:
            charts.append(ChartConfig(
                type=chart_config["type"],
                title=chart_config.get("title", "Chart"),
                description=chart_config.get("description", ""),
                data=data,
                xKey=chart_config.get("xKey", ""),
                yKeys=chart_config.get("yKeys", []),
                groupBy=chart_config.get("groupBy"),
                colorScheme=chart_config.get("colorScheme", "default")
            ))

    # Save to session history
    if session_id not in _sessions and len(_sessions) >= MAX_SESSIONS:
        oldest = next(iter(_sessions))
        del _sessions[oldest]

    _sessions.setdefault(session_id, []).append({
        "prompt": request.prompt,
        "sql_queries": llm_response.get("sql_queries", []),
        "charts_count": len(charts)
    })

    # Keep only last 10 entries per session
    if len(_sessions[session_id]) > 10:
        _sessions[session_id] = _sessions[session_id][-10:]

    elapsed_ms = int((time.time() - start_time) * 1000)

    return QueryResponse(
        charts=charts,
        insights=llm_response.get("insights", []),
        metadata={
            "query_time_ms": elapsed_ms,
            "dataset": target_table,
            "queries_executed": len(query_results),
            "rows_returned": sum(len(r) for r in query_results),
            "session_id": session_id
        }
    )


@router.post("/upload", response_model=UploadResponse)
def upload_csv(
    file: UploadFile = File(...),
    table_name: str | None = Form(None)
):
    """Upload a CSV file and make it queryable."""
    # Validate filename
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(file.filename)
    if not _SAFE_FILENAME_RE.match(safe_filename):
        raise HTTPException(status_code=400, detail="Invalid filename. Use only letters, numbers, dashes, underscores, and spaces.")

    # Read file synchronously (sync handler — no await needed)
    contents = file.file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024*1024)} MB")

    # Validate table_name if provided
    if table_name:
        sanitized = re.sub(r"[^a-z0-9_]", "", table_name.lower())
        if not sanitized or not re.match(r"^[a-z][a-z0-9_]*$", sanitized):
            raise HTTPException(status_code=400, detail="Invalid table name. Use lowercase letters, numbers, and underscores only.")
        table_name = sanitized

    # Save uploaded file
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, safe_filename)

    try:
        with open(filepath, "wb") as f:
            f.write(contents)

        # Load into PostgreSQL via query engine
        actual_table_name = query_engine.load_csv(filepath, table_name)
        info = query_engine.get_table_info(actual_table_name)

        return UploadResponse(
            success=True,
            table_name=actual_table_name,
            row_count=info["row_count"],
            columns=[
                ColumnInfo(name=c["name"], type=c["type"])
                for c in info["columns"]
            ],
            message=f"Successfully loaded '{safe_filename}' as table '{actual_table_name}' with {info['row_count']} rows"
        )

    except Exception as e:
        # Clean up on failure
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=400, detail=f"Failed to load CSV: {str(e)}")


@router.delete("/session/{session_id}")
def clear_session(session_id: str):
    """Clear conversation history for a session."""
    session_id = _validate_session_id(session_id)
    if session_id in _sessions:
        del _sessions[session_id]
    return {"message": "Session cleared"}
