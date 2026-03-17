"""
Schema Introspector -- builds schema descriptions for LLM context.
All introspection is done via SQL against PostgreSQL (no Pandas).
"""

import time
from core.query_engine import query_engine

# Schema cache: { table_name: (schema_string, timestamp) }
_schema_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL = 300  # 5 minutes


def get_schema_description(table_name: str) -> str:
    """
    Build a detailed schema description string for the LLM.
    Cached for 5 minutes to avoid repeated DB introspection on every query.
    """
    now = time.time()
    cached = _schema_cache.get(table_name)
    if cached and (now - cached[1]) < _CACHE_TTL:
        return cached[0]

    info = query_engine.get_table_info(table_name)

    lines = [
        f"Table: {info['table_name']}",
        f"Total Rows: {info['row_count']}",
        f"Columns ({len(info['columns'])}):"
    ]

    for col in info["columns"]:
        samples = ", ".join(str(v) for v in col["sample_values"])
        lines.append(f"  - {col['name']} ({col['type']}) -- e.g. {samples}")

    for col in info["columns"]:
        if col["type"] == "TEXT":
            unique_vals = query_engine.get_unique_values(table_name, col["name"])
            if unique_vals is not None:
                lines.append(f"  Unique values for '{col['name']}': {unique_vals}")

    for col in info["columns"]:
        if "date" in col["name"].lower() or col["type"] == "DATE":
            date_range = query_engine.get_date_range(table_name, col["name"])
            if date_range:
                lines.append(f"  Date range for '{col['name']}': {date_range[0]} to {date_range[1]}")

    schema_str = "\n".join(lines)
    _schema_cache[table_name] = (schema_str, now)
    return schema_str


def invalidate_schema_cache(table_name: str = None):
    """Invalidate schema cache for a specific table or all tables."""
    if table_name:
        _schema_cache.pop(table_name, None)
    else:
        _schema_cache.clear()


def get_datasets_info() -> list[dict]:
    """Return summary info about all loaded datasets."""
    datasets = []
    for table_name in query_engine.get_table_names():
        info = query_engine.get_table_info(table_name)
        datasets.append({
            "name": table_name,
            "row_count": info["row_count"],
            "columns": [
                {"name": c["name"], "type": c["type"]}
                for c in info["columns"]
            ]
        })
    return datasets
