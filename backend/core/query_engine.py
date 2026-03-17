"""
Query Engine -- connects to Supabase PostgreSQL and executes SQL safely.

Zero Pandas dependency: uses Python csv module for CSV parsing,
psycopg2 for PostgreSQL interaction.
"""

import csv
import io
import os
import re
from datetime import datetime, date
from decimal import Decimal
from typing import Any

from psycopg2 import pool as pgpool, sql as pgsql
from psycopg2.extras import execute_values

# Table names must be alphanumeric/underscore only
_SAFE_NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$")


class QueryEngine:
    """Manages Supabase PostgreSQL connections and safe SQL execution."""

    def __init__(self):
        self._pool: pgpool.ThreadedConnectionPool | None = None
        self._tables: set[str] = set()

    def initialize(self):
        """Connect to Supabase PostgreSQL and discover existing tables."""
        db_url = os.getenv("SUPABASE_DB_URL")
        if not db_url:
            raise ValueError(
                "SUPABASE_DB_URL not set. Add it to your .env file.\n"
                "Format: postgresql://postgres.xxxx:password@host:port/postgres"
            )
        self._pool = pgpool.ThreadedConnectionPool(1, 10, db_url)
        self._refresh_tables()

    def _get_conn(self):
        if not self._pool:
            raise RuntimeError("Query engine not initialized. Call initialize() first.")
        return self._pool.getconn()

    def _put_conn(self, conn):
        if self._pool:
            self._pool.putconn(conn)

    def _refresh_tables(self):
        """Refresh the set of known tables from the database."""
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT table_name FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                """)
                self._tables = {row[0] for row in cur.fetchall()}
        finally:
            self._put_conn(conn)

    # ------------------------------------------------------------------
    # CSV upload (no Pandas)
    # ------------------------------------------------------------------

    def load_csv(self, filepath: str, table_name: str = None) -> str:
        """Parse a CSV file and load it into PostgreSQL. Returns the table name."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"CSV not found: {filepath}")

        # Read raw bytes and handle encoding / binary preambles
        with open(filepath, "rb") as f:
            raw = f.read()

        csv_start = 0
        for marker in [b"order_id", b"id,", b"date,"]:
            idx = raw.find(marker)
            if idx != -1:
                csv_start = idx
                break
        if csv_start > 0:
            raw = raw[csv_start:]

        # Strip trailing binary
        last_newline = raw.rfind(b"\n")
        if last_newline != -1 and last_newline < len(raw) - 1:
            trailing = raw[last_newline + 1:]
            if any(b > 127 for b in trailing):
                raw = raw[:last_newline + 1]

        # Decode
        text = None
        for encoding in ["utf-8", "latin-1", "cp1252", "iso-8859-1"]:
            try:
                text = raw.decode(encoding)
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        if text is None:
            raise ValueError("Could not decode CSV with any supported encoding")

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            raise ValueError("CSV has no header row")

        original_fields = list(reader.fieldnames)
        columns = [
            col.strip().lower().replace(" ", "_").replace("-", "_")
            for col in original_fields
        ]

        rows = list(reader)
        if not rows:
            raise ValueError("CSV has no data rows")

        # Derive table name
        if not table_name:
            base = os.path.splitext(os.path.basename(filepath))[0]
            table_name = base.strip().lower().replace(" ", "_").replace("-", "_")
        table_name = re.sub(r"[^a-z0-9_]", "", table_name)
        if not table_name or not _SAFE_NAME_RE.match(table_name):
            table_name = f"table_{abs(hash(filepath)) % 100000}"

        # Infer PostgreSQL types from the data
        col_types = self._infer_types(columns, original_fields, rows)

        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                # Drop existing table and create new one
                cur.execute(pgsql.SQL("DROP TABLE IF EXISTS {}").format(
                    pgsql.Identifier(table_name)
                ))

                col_defs = pgsql.SQL(", ").join(
                    pgsql.SQL("{} {}").format(pgsql.Identifier(col), pgsql.SQL(ctype))
                    for col, ctype in zip(columns, col_types)
                )
                cur.execute(pgsql.SQL("CREATE TABLE {} ({})").format(
                    pgsql.Identifier(table_name), col_defs
                ))

                # Prepare values for batch insert (with safe type coercion)
                insert_rows = []
                for row in rows:
                    values = []
                    for i, orig_field in enumerate(original_fields):
                        val = row.get(orig_field, "").strip()
                        if val == "":
                            values.append(None)
                        elif col_types[i] == "DATE":
                            values.append(self._parse_date(val))
                        elif col_types[i] == "BIGINT":
                            try:
                                values.append(int(val))
                            except (ValueError, TypeError):
                                values.append(None)
                        elif col_types[i] == "DOUBLE PRECISION":
                            try:
                                values.append(float(val))
                            except (ValueError, TypeError):
                                values.append(None)
                        else:
                            values.append(val)
                    insert_rows.append(tuple(values))

                # Batch insert with execute_values (fast, no COPY needed)
                col_ids = pgsql.SQL(", ").join(pgsql.Identifier(c) for c in columns)
                insert_sql = pgsql.SQL("INSERT INTO {} ({}) VALUES %s").format(
                    pgsql.Identifier(table_name), col_ids
                )
                execute_values(cur, insert_sql.as_string(conn), insert_rows, page_size=1000)

            conn.commit()
            self._tables.add(table_name)
            return table_name
        except Exception:
            conn.rollback()
            raise
        finally:
            self._put_conn(conn)

    def _infer_types(self, columns: list[str], original_fields: list[str],
                     rows: list[dict]) -> list[str]:
        """Infer PostgreSQL column types from CSV data."""
        sample = rows[:200]
        types = []

        for i, col in enumerate(columns):
            orig_key = original_fields[i]

            if "date" in col:
                types.append("DATE")
                continue

            is_int = True
            is_float = True
            seen_value = False

            for row in sample:
                val = row.get(orig_key, "").strip()
                if not val:
                    continue
                seen_value = True
                try:
                    int(val)
                except ValueError:
                    is_int = False
                try:
                    float(val)
                except ValueError:
                    is_float = False
                    is_int = False

            if not seen_value:
                types.append("TEXT")
            elif is_int:
                types.append("BIGINT")
            elif is_float:
                types.append("DOUBLE PRECISION")
            else:
                types.append("TEXT")

        return types

    def _parse_date(self, val: str) -> str:
        """Try to parse a date string into YYYY-MM-DD."""
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d",
                     "%d-%m-%Y", "%m-%d-%Y"):
            try:
                return datetime.strptime(val, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        # Return as-is if no format matches (let PostgreSQL handle it)
        return val

    # ------------------------------------------------------------------
    # Query execution
    # ------------------------------------------------------------------

    # Maximum rows returned from any single query (prevents memory exhaustion)
    MAX_RESULT_ROWS = 10_000
    # Statement timeout in milliseconds (prevents runaway queries)
    STATEMENT_TIMEOUT_MS = 30_000

    # PostgreSQL functions that can leak server info or access the filesystem
    _BLOCKED_FUNCTIONS = re.compile(
        r"\b("
        r"pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file"
        r"|pg_ls_logdir|pg_ls_waldir|pg_ls_tmpdir|pg_ls_archive_statusdir"
        r"|lo_import|lo_export|lo_get|lo_put|lo_from_bytea"
        r"|inet_server_addr|inet_server_port|inet_client_addr|inet_client_port"
        r"|current_setting|set_config"
        r"|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile"
        r"|dblink|dblink_connect|dblink_exec|dblink_send_query"
        r"|query_to_xml|query_to_json|xpath"
        r")\s*\(",
        re.IGNORECASE,
    )

    # System catalogs and internal tables that should never be queried
    _BLOCKED_TABLES = re.compile(
        r"\b("
        r"pg_shadow|pg_authid|pg_auth_members|pg_roles|pg_user"
        r"|pg_stat_activity|pg_stat_replication|pg_stat_ssl"
        r"|pg_settings|pg_config|pg_hba_file_rules|pg_file_settings"
        r"|pg_stat_statements|pg_stat_user_tables|pg_stat_user_indexes"
        r"|pg_catalog\.\w+"
        r"|pg_largeobject|pg_largeobject_metadata"
        r"|pg_proc|pg_extension|pg_available_extensions"
        r"|information_schema\.\w+"
        r")\b",
        re.IGNORECASE,
    )

    def execute_query(self, sql: str, allowed_tables: set[str] | None = None) -> list[dict[str, Any]]:
        """Execute a read-only SQL query and return results as list of dicts.

        Args:
            sql: The SQL query to execute.
            allowed_tables: If provided, the query is rejected unless it only
                            references tables in this set (plus common CTEs).
        """
        if not self._pool:
            raise RuntimeError("Query engine not initialized.")

        sql_upper = sql.strip().upper()

        # Reject compound statements
        stripped = sql.strip().rstrip(";")
        if ";" in stripped:
            raise ValueError("Compound SQL statements are not allowed")

        blocked_keywords = [
            # DML
            "INSERT", "UPDATE", "DELETE", "MERGE",
            # DDL
            "DROP", "ALTER", "CREATE", "TRUNCATE",
            # DCL / admin
            "COPY", "GRANT", "REVOKE", "SET", "RESET",
            # Transaction control
            "SAVEPOINT", "RELEASE", "ROLLBACK", "COMMIT", "BEGIN",
            # Async / locking
            "LISTEN", "NOTIFY", "LOCK", "DISCARD",
            # Code execution (PL/pgSQL injection)
            "DO", "CALL", "PREPARE", "EXECUTE", "DEALLOCATE",
            # Information leakage
            "EXPLAIN",
        ]
        for keyword in blocked_keywords:
            if re.search(rf"\b{keyword}\b", sql_upper):
                raise ValueError(f"Disallowed SQL keyword: {keyword}")

        if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
            raise ValueError("Only SELECT queries are allowed")

        # Block dangerous PostgreSQL functions
        if self._BLOCKED_FUNCTIONS.search(sql):
            raise ValueError("Query contains a disallowed PostgreSQL function")

        # Block access to system catalogs
        if self._BLOCKED_TABLES.search(sql):
            raise ValueError("Query references a disallowed system table")

        # Enforce table allowlist: only permit queries against known user tables
        if allowed_tables:
            self._enforce_table_allowlist(sql, allowed_tables)

        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                # Enforce read-only transaction and statement timeout
                cur.execute("SET LOCAL statement_timeout = %s", (self.STATEMENT_TIMEOUT_MS,))
                cur.execute("SET LOCAL default_transaction_read_only = ON")
                cur.execute(sql)
                if not cur.description:
                    return []
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchmany(self.MAX_RESULT_ROWS)
                return [
                    {col: self._convert_value(val) for col, val in zip(columns, row)}
                    for row in rows
                ]
        except Exception as e:
            raise ValueError(f"SQL execution error: {str(e)}")
        finally:
            # Reset connection state so the pool connection is clean
            conn.rollback()
            self._put_conn(conn)

    def _enforce_table_allowlist(self, sql: str, allowed_tables: set[str]):
        """Reject queries referencing tables outside the allowed set."""
        # Extract identifiers that appear after FROM or JOIN keywords
        table_ref_pattern = re.compile(
            r"\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)",
            re.IGNORECASE,
        )
        referenced = {m.group(1).lower() for m in table_ref_pattern.finditer(sql)}
        # Also catch schema-qualified references like public.tablename
        schema_ref_pattern = re.compile(
            r"\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)",
            re.IGNORECASE,
        )
        for m in schema_ref_pattern.finditer(sql):
            schema, table = m.group(1).lower(), m.group(2).lower()
            if schema != "public":
                raise ValueError(f"Queries against schema '{schema}' are not allowed")
            referenced.add(table)

        allowed_lower = {t.lower() for t in allowed_tables}
        disallowed = referenced - allowed_lower
        if disallowed:
            raise ValueError(
                f"Query references disallowed table(s): {', '.join(sorted(disallowed))}. "
                f"Only these tables are allowed: {', '.join(sorted(allowed_lower))}"
            )

    @staticmethod
    def _convert_value(val: Any) -> Any:
        """Convert PostgreSQL-specific types to JSON-serializable Python types."""
        if val is None:
            return None
        if isinstance(val, Decimal):
            return float(val)
        if isinstance(val, (date, datetime)):
            return val.strftime("%Y-%m-%d")
        return val

    # ------------------------------------------------------------------
    # Schema introspection (no Pandas)
    # ------------------------------------------------------------------

    def get_table_names(self) -> list[str]:
        """Return sorted list of table names."""
        return sorted(self._tables)

    def get_table_info(self, table_name: str) -> dict[str, Any]:
        """Return detailed info about a table (columns, types, samples, row count)."""
        if table_name not in self._tables:
            raise ValueError(f"Table '{table_name}' not found")
        if not _SAFE_NAME_RE.match(table_name):
            raise ValueError(f"Invalid table name: '{table_name}'")

        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                # Column info from information_schema
                cur.execute("""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position
                """, (table_name,))
                col_rows = cur.fetchall()

                # Row count
                cur.execute(pgsql.SQL("SELECT COUNT(*) FROM {}").format(
                    pgsql.Identifier(table_name)
                ))
                row_count = cur.fetchone()[0]

                # Sample values per column
                columns_info = []
                for col_name, col_type in col_rows:
                    cur.execute(
                        pgsql.SQL(
                            "SELECT DISTINCT {} FROM {} WHERE {} IS NOT NULL LIMIT 3"
                        ).format(
                            pgsql.Identifier(col_name),
                            pgsql.Identifier(table_name),
                            pgsql.Identifier(col_name),
                        )
                    )
                    samples = [str(self._convert_value(row[0])) for row in cur.fetchall()]
                    columns_info.append({
                        "name": col_name,
                        "type": col_type.upper(),
                        "sample_values": samples,
                    })

                return {
                    "table_name": table_name,
                    "row_count": row_count,
                    "columns": columns_info,
                }
        finally:
            self._put_conn(conn)

    def get_unique_values(self, table_name: str, column_name: str,
                          max_unique: int = 20) -> list[str] | None:
        """Return unique values for a column if cardinality <= max_unique, else None."""
        if not _SAFE_NAME_RE.match(table_name):
            return None
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    pgsql.SQL("SELECT COUNT(DISTINCT {}) FROM {}").format(
                        pgsql.Identifier(column_name),
                        pgsql.Identifier(table_name),
                    )
                )
                count = cur.fetchone()[0]
                if count > max_unique:
                    return None
                cur.execute(
                    pgsql.SQL(
                        "SELECT DISTINCT {} FROM {} WHERE {} IS NOT NULL ORDER BY {} LIMIT %s"
                    ).format(
                        pgsql.Identifier(column_name),
                        pgsql.Identifier(table_name),
                        pgsql.Identifier(column_name),
                        pgsql.Identifier(column_name),
                    ),
                    (max_unique,)
                )
                return [str(self._convert_value(row[0])) for row in cur.fetchall()]
        finally:
            self._put_conn(conn)

    def get_date_range(self, table_name: str, column_name: str) -> tuple[str, str] | None:
        """Return (min_date, max_date) for a date column, or None."""
        if not _SAFE_NAME_RE.match(table_name):
            return None
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    pgsql.SQL("SELECT MIN({}), MAX({}) FROM {}").format(
                        pgsql.Identifier(column_name),
                        pgsql.Identifier(column_name),
                        pgsql.Identifier(table_name),
                    )
                )
                row = cur.fetchone()
                if row and row[0] is not None:
                    return (str(row[0]), str(row[1]))
                return None
        finally:
            self._put_conn(conn)

    def get_row_count(self, table_name: str) -> int:
        """Return the row count for a table."""
        if not _SAFE_NAME_RE.match(table_name):
            raise ValueError(f"Invalid table name: '{table_name}'")
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(pgsql.SQL("SELECT COUNT(*) FROM {}").format(
                    pgsql.Identifier(table_name)
                ))
                return cur.fetchone()[0]
        finally:
            self._put_conn(conn)

    def remove_table(self, table_name: str):
        """Drop a table from the database."""
        if not _SAFE_NAME_RE.match(table_name):
            raise ValueError(f"Invalid table name: '{table_name}'")
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(pgsql.SQL("DROP TABLE IF EXISTS {}").format(
                    pgsql.Identifier(table_name)
                ))
            conn.commit()
            self._tables.discard(table_name)
        finally:
            self._put_conn(conn)

    def close(self):
        """Close the connection pool."""
        if self._pool:
            self._pool.closeall()
            self._pool = None


# Singleton instance
query_engine = QueryEngine()
