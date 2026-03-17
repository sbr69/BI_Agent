"""
One-time seed script: imports CSV files from data/ into Supabase PostgreSQL.
Run this once to populate your database, then start the server normally.

Usage:  python seed.py
"""

import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()

# Add backend dir to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from core.query_engine import query_engine

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def seed():
    print("[*] Connecting to Supabase...")
    query_engine.initialize()

    existing = query_engine.get_table_names()
    print(f"[+] Connected. Existing tables: {existing or '(none)'}")

    if not os.path.isdir(DATA_DIR):
        print(f"[!] No data/ directory found at {DATA_DIR}")
        return

    csv_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".csv")]
    if not csv_files:
        print("[!] No CSV files found in data/")
        return

    for filename in csv_files:
        filepath = os.path.join(DATA_DIR, filename)
        print(f"\n[*] Importing {filename}...")

        start = time.time()
        try:
            table_name = query_engine.load_csv(filepath)
            row_count = query_engine.get_row_count(table_name)
            elapsed = time.time() - start
            print(f"[+] Done: '{table_name}' — {row_count:,} rows in {elapsed:.1f}s")
        except Exception as e:
            print(f"[!] Failed: {e}")

    print("\n[+] Seeding complete. You can now start the server: python -m uvicorn main:app --reload")
    query_engine.close()


if __name__ == "__main__":
    seed()
