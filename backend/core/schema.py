"""
Schema Introspector — builds schema descriptions for LLM context.
"""

from core.query_engine import query_engine


def get_schema_description(table_name: str) -> str:
    """
    Build a detailed schema description string for the LLM.
    Includes table name, columns with types, sample values, and row count.
    """
    info = query_engine.get_table_info(table_name)

    lines = [
        f"Table: {info['table_name']}",
        f"Total Rows: {info['row_count']}",
        f"Columns ({len(info['columns'])}):"
    ]

    for col in info["columns"]:
        samples = ", ".join(str(v) for v in col["sample_values"])
        lines.append(f"  - {col['name']} ({col['type']}) — e.g. {samples}")

    # Add unique values for categorical columns
    df = query_engine.tables[table_name]
    for col in info["columns"]:
        col_name = col["name"]
        if col["type"] == "TEXT" and df[col_name].nunique() <= 20:
            unique_vals = df[col_name].dropna().unique().tolist()
            lines.append(f"  Unique values for '{col_name}': {unique_vals}")

    # Add date range if date columns exist
    for col in info["columns"]:
        if "date" in col["name"].lower():
            col_name = col["name"]
            min_date = df[col_name].min()
            max_date = df[col_name].max()
            lines.append(f"  Date range for '{col_name}': {min_date} to {max_date}")

    return "\n".join(lines)


def get_all_schemas() -> str:
    """Build schema descriptions for all loaded tables."""
    table_names = query_engine.get_table_names()
    schemas = []
    for name in table_names:
        schemas.append(get_schema_description(name))
    return "\n\n---\n\n".join(schemas)


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
