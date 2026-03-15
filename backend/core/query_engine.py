"""
Query Engine — loads CSVs into SQLite in-memory and executes SQL safely.
"""

import sqlite3
import os
import pandas as pd
from typing import Any


class QueryEngine:
    """Manages CSV data loading into SQLite and safe SQL execution."""

    def __init__(self):
        self.conn: sqlite3.Connection | None = None
        self.tables: dict[str, pd.DataFrame] = {}

    def initialize(self, data_dir: str = None):
        """Create in-memory SQLite DB and load all CSVs from data_dir."""
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

        if data_dir and os.path.isdir(data_dir):
            for filename in os.listdir(data_dir):
                if filename.lower().endswith(".csv"):
                    filepath = os.path.join(data_dir, filename)
                    self.load_csv(filepath)

    def load_csv(self, filepath: str, table_name: str = None) -> str:
        """Load a CSV file into SQLite as a table. Returns the table name."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"CSV not found: {filepath}")

        # Read raw bytes to detect and strip binary preambles (e.g. macOS plist)
        with open(filepath, "rb") as f:
            raw = f.read()

        # Check if file has a binary preamble before the CSV header
        # Look for common CSV header patterns
        csv_start = None
        for marker in [b"order_id", b"id,", b"date,"]:
            idx = raw.find(marker)
            if idx != -1:
                csv_start = idx
                break

        if csv_start is None:
            # No known header found, try from beginning
            csv_start = 0

        if csv_start > 0:
            raw = raw[csv_start:]

        # Strip any trailing binary data after the last newline
        last_newline = raw.rfind(b"\n")
        if last_newline != -1 and last_newline < len(raw) - 1:
            trailing = raw[last_newline + 1:]
            # If trailing data contains non-printable chars, strip it
            if any(b > 127 for b in trailing):
                raw = raw[:last_newline + 1]

        # Write cleaned data to a temp buffer and read with pandas
        import io
        encodings = ["utf-8", "latin-1", "cp1252", "iso-8859-1"]
        df = None
        for encoding in encodings:
            try:
                text = raw.decode(encoding)
                df = pd.read_csv(io.StringIO(text))
                break
            except (UnicodeDecodeError, UnicodeError, pd.errors.ParserError):
                continue
        if df is None:
            raise ValueError(f"Could not read CSV with any encoding: {encodings}")

        # Clean column names: lowercase, replace spaces with underscores
        df.columns = [
            col.strip().lower().replace(" ", "_").replace("-", "_")
            for col in df.columns
        ]

        # Derive table name from filename if not provided
        if not table_name:
            base = os.path.splitext(os.path.basename(filepath))[0]
            table_name = base.strip().lower().replace(" ", "_").replace("-", "_")

        # Parse date columns
        for col in df.columns:
            if "date" in col.lower():
                try:
                    df[col] = pd.to_datetime(df[col]).dt.strftime("%Y-%m-%d")
                except (ValueError, TypeError):
                    pass

        # Store reference and load into SQLite
        self.tables[table_name] = df
        df.to_sql(table_name, self.conn, if_exists="replace", index=False)

        return table_name

    def execute_query(self, sql: str) -> list[dict[str, Any]]:
        """Execute a read-only SQL query and return results as list of dicts."""
        if not self.conn:
            raise RuntimeError("Query engine not initialized. Call initialize() first.")

        # Safety: block write operations
        sql_upper = sql.strip().upper()
        blocked_keywords = [
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
            "TRUNCATE", "REPLACE INTO", "ATTACH", "DETACH"
        ]
        for keyword in blocked_keywords:
            if sql_upper.startswith(keyword):
                raise ValueError(f"Write operations are not allowed: {keyword}")

        try:
            cursor = self.conn.execute(sql)
            columns = [description[0] for description in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except sqlite3.Error as e:
            raise ValueError(f"SQL execution error: {str(e)}")

    def get_table_names(self) -> list[str]:
        """Return list of loaded table names."""
        return list(self.tables.keys())

    def get_table_info(self, table_name: str) -> dict[str, Any]:
        """Return detailed info about a table."""
        if table_name not in self.tables:
            raise ValueError(f"Table '{table_name}' not found")

        df = self.tables[table_name]

        # Get column types from SQLite
        cursor = self.conn.execute(f"PRAGMA table_info({table_name})")
        columns_info = []
        for row in cursor.fetchall():
            col_name = row[1]
            col_type = row[2]
            columns_info.append({
                "name": col_name,
                "type": col_type,
                "sample_values": df[col_name].dropna().head(3).tolist()
            })

        return {
            "table_name": table_name,
            "row_count": len(df),
            "columns": columns_info
        }

    def remove_table(self, table_name: str):
        """Remove a table from the engine."""
        if table_name in self.tables:
            del self.tables[table_name]
            self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")


# Singleton instance
query_engine = QueryEngine()
