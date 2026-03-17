"""
API Routes -- endpoints for querying, datasets, upload, export, pinning, and health.
"""

import csv
import io
import os
import re
import time
import uuid
import json
from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse

from api.models import (
    QueryRequest, QueryResponse, ChartConfig, KPIConfig, HighlightConfig,
    DatasetsResponse, DatasetInfo, ColumnInfo,
    UploadResponse, HealthResponse,
    PinRequest, PinnedDashboard,
    ScheduleRequest, ScheduledReport,
)
from core.query_engine import query_engine
from core.schema import get_schema_description, get_datasets_info, invalidate_schema_cache
from core.llm import get_llm_client
from core.prompts import get_system_prompt, get_followup_prompt

router = APIRouter(prefix="/api")

# In-memory session store for conversation context
_sessions: dict[str, list[dict]] = {}

# In-memory pinned dashboards store
_pinned_dashboards: dict[str, dict] = {}

# In-memory scheduled reports store
_scheduled_reports: dict[str, dict] = {}

# Constraints
MAX_SESSIONS = 1000
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
_SESSION_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
_SAFE_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_\- ]+\.csv$")

# Simple in-memory rate limiter: { ip: [timestamps] }
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 30  # max requests per window
RATE_LIMIT_WINDOW = 60  # seconds


def _check_rate_limit(request: Request):
    """Check if the request exceeds the rate limit."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    # Clean old entries
    _rate_limits[ip] = [t for t in _rate_limits[ip] if t > window_start]
    if len(_rate_limits[ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {RATE_LIMIT_MAX} queries per minute."
        )
    _rate_limits[ip].append(now)


def _validate_session_id(session_id: str) -> str:
    """Validate and return a safe session ID."""
    if not _SESSION_ID_RE.match(session_id):
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    return session_id


def _format_kpi_value(raw, prefix: str = "") -> str:
    """Format a raw numeric KPI value into a human-readable string."""
    try:
        num = float(raw)
    except (TypeError, ValueError):
        return str(raw)

    abs_num = abs(num)
    if abs_num >= 1_000_000_000:
        formatted = f"{num / 1_000_000_000:.2f}B"
    elif abs_num >= 1_000_000:
        formatted = f"{num / 1_000_000:.2f}M"
    elif abs_num >= 1_000:
        formatted = f"{num / 1_000:.1f}K"
    elif isinstance(raw, float) or (abs_num > 0 and abs_num < 1):
        formatted = f"{num:,.2f}"
    else:
        formatted = f"{int(num):,}"

    return f"{prefix}{formatted}"


# ---------------------------------------------------------------------------
# All route handlers are sync (def, not async def) because they call blocking
# psycopg2 / Groq SDK methods.  FastAPI automatically dispatches sync handlers
# to a thread-pool so the event loop stays unblocked.
# ---------------------------------------------------------------------------


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    try:
        tables = query_engine.get_table_names()
        total_rows = sum(query_engine.get_row_count(t) for t in tables)
        return HealthResponse(
            status="ok",
            tables_loaded=len(tables),
            total_rows=total_rows
        )
    except Exception:
        return HealthResponse(status="error", tables_loaded=0, total_rows=0)


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
def process_query(request: QueryRequest, req: Request):
    """Process a natural language query and return chart data."""
    _check_rate_limit(req)
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

    # Build prompt with optional date range filter context
    date_filter_context = ""
    if request.date_from or request.date_to:
        date_filter_context = "\n\n## Active Date Filter\n"
        if request.date_from and request.date_to:
            date_filter_context += f"The user has set a global date filter: FROM '{request.date_from}' TO '{request.date_to}'.\n"
        elif request.date_from:
            date_filter_context += f"The user has set a global date filter: FROM '{request.date_from}' onwards.\n"
        else:
            date_filter_context += f"The user has set a global date filter: UP TO '{request.date_to}'.\n"
        date_filter_context += "You MUST add a WHERE clause (or AND condition) to ALL SQL queries to filter by the date column in this range.\n"
        date_filter_context += "Use the date column from the schema (e.g., order_date, date, etc.).\n"

    if history:
        system_prompt = get_followup_prompt(schema, history) + date_filter_context
    else:
        system_prompt = get_system_prompt(schema) + date_filter_context

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

    # Only allow queries against the target table (prevents cross-dataset exfiltration)
    allowed_tables = {target_table}

    for q in llm_response.get("sql_queries", []):
        try:
            result = query_engine.execute_query(q["sql"], allowed_tables=allowed_tables)
            query_results.append(result)
        except Exception as e:
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
                colorScheme=chart_config.get("colorScheme", "default"),
                highlights=[
                    HighlightConfig(**h)
                    for h in chart_config.get("highlights", [])
                    if isinstance(h, dict) and h.get("value") is not None
                ],
            ))

    # Extract KPIs from LLM response — compute values from query results
    kpis = []
    for kpi_data in llm_response.get("kpis", []):
        if not isinstance(kpi_data, dict) or not kpi_data.get("label"):
            continue

        # If LLM provided sql_index + valueKey, compute value from query results
        sql_idx = kpi_data.get("sql_index")
        value_key = kpi_data.get("valueKey")

        if sql_idx is not None and value_key and sql_idx < len(query_results):
            data = query_results[sql_idx]
            if data and value_key in data[0]:
                raw = data[0][value_key]
                prefix = kpi_data.get("prefix", "")
                formatted = _format_kpi_value(raw, prefix)
                kpis.append(KPIConfig(
                    label=kpi_data["label"],
                    value=formatted,
                    change=kpi_data.get("change"),
                    trend=kpi_data.get("trend", "neutral"),
                ))
        elif kpi_data.get("value"):
            # Fallback: LLM provided a static value
            kpis.append(KPIConfig(
                label=kpi_data["label"],
                value=str(kpi_data["value"]),
                change=kpi_data.get("change"),
                trend=kpi_data.get("trend", "neutral"),
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
        kpis=kpis,
        insights=llm_response.get("insights", []),
        metadata={
            "query_time_ms": elapsed_ms,
            "dataset": target_table,
            "queries_executed": len(query_results),
            "rows_returned": sum(len(r) for r in query_results),
            "session_id": session_id,
        }
    )


# ---------------------------------------------------------------------------
# Export endpoints
# ---------------------------------------------------------------------------

@router.post("/export/chart-csv")
def export_chart_csv(payload: dict, req: Request):
    """Export chart data as a downloadable CSV file."""
    _check_rate_limit(req)
    data = payload.get("data", [])
    title = payload.get("title", "export")

    if not data:
        raise HTTPException(status_code=400, detail="No data to export")

    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

    output.seek(0)
    safe_title = re.sub(r"[^a-zA-Z0-9_\- ]", "", title)[:50]
    filename = f"{safe_title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ---------------------------------------------------------------------------
# Dashboard Pinning / Saving
# ---------------------------------------------------------------------------

@router.post("/pins")
def pin_dashboard(payload: PinRequest):
    """Save/pin a dashboard tile for persistence."""
    pin_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()
    pinned = {
        "id": pin_id,
        "title": payload.title,
        "query_prompt": payload.query_prompt,
        "charts": payload.charts,
        "kpis": payload.kpis,
        "insights": payload.insights,
        "dataset": payload.dataset,
        "created_at": now,
    }
    _pinned_dashboards[pin_id] = pinned
    return pinned


@router.get("/pins")
def list_pins():
    """List all pinned dashboards."""
    return {"pins": list(_pinned_dashboards.values())}


@router.delete("/pins/{pin_id}")
def delete_pin(pin_id: str):
    """Remove a pinned dashboard."""
    if pin_id in _pinned_dashboards:
        del _pinned_dashboards[pin_id]
        return {"message": "Pin removed"}
    raise HTTPException(status_code=404, detail="Pin not found")


# ---------------------------------------------------------------------------
# Scheduled Reports
# ---------------------------------------------------------------------------

@router.post("/schedules")
def create_schedule(payload: ScheduleRequest):
    """Create a scheduled report."""
    schedule_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()
    schedule = {
        "id": schedule_id,
        "title": payload.title,
        "prompt": payload.prompt,
        "dataset": payload.dataset,
        "cron": payload.cron,
        "email": payload.email,
        "created_at": now,
        "last_run": None,
        "active": True,
    }
    _scheduled_reports[schedule_id] = schedule
    return schedule


@router.get("/schedules")
def list_schedules():
    """List all scheduled reports."""
    return {"schedules": list(_scheduled_reports.values())}


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: str):
    """Remove a scheduled report."""
    if schedule_id in _scheduled_reports:
        del _scheduled_reports[schedule_id]
        return {"message": "Schedule removed"}
    raise HTTPException(status_code=404, detail="Schedule not found")


@router.post("/schedules/{schedule_id}/toggle")
def toggle_schedule(schedule_id: str):
    """Toggle a scheduled report active/inactive."""
    if schedule_id in _scheduled_reports:
        _scheduled_reports[schedule_id]["active"] = not _scheduled_reports[schedule_id]["active"]
        return _scheduled_reports[schedule_id]
    raise HTTPException(status_code=404, detail="Schedule not found")


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

@router.get("/session/{session_id}")
def get_session(session_id: str):
    """Get conversation history for a session."""
    session_id = _validate_session_id(session_id)
    history = _sessions.get(session_id, [])
    return {"session_id": session_id, "history": history}


@router.delete("/session/{session_id}")
def clear_session(session_id: str):
    """Clear conversation history for a session."""
    session_id = _validate_session_id(session_id)
    if session_id in _sessions:
        del _sessions[session_id]
    return {"message": "Session cleared"}


# ---------------------------------------------------------------------------
# Upload & Preview
# ---------------------------------------------------------------------------

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
        invalidate_schema_cache(actual_table_name)
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


@router.get("/preview/{dataset}")
def preview_dataset(dataset: str, limit: int = 100):
    """Return raw preview rows from a dataset without going through the LLM."""
    tables = query_engine.get_table_names()
    if dataset not in tables:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset}' not found")

    limit = min(max(1, limit), 500)

    try:
        from psycopg2 import sql as pgsql
        conn = query_engine._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    pgsql.SQL("SELECT * FROM {} LIMIT %s").format(
                        pgsql.Identifier(dataset)
                    ),
                    (limit,)
                )
                if not cur.description:
                    return {"data": [], "columns": []}
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                data = [
                    {col: query_engine._convert_value(val) for col, val in zip(columns, row)}
                    for row in rows
                ]
                return {"data": data, "columns": columns, "row_count": len(data)}
        finally:
            query_engine._put_conn(conn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview error: {str(e)}")
