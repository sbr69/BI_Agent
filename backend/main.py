"""
FastAPI Application -- entry point for the BI Dashboard backend.
Connects to Supabase PostgreSQL on startup.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from core.query_engine import query_engine
from api.routes import router

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the query engine on startup, close on shutdown."""
    print("[*] Starting BI Dashboard Backend...")

    try:
        # Connect to Supabase PostgreSQL
        query_engine.initialize()

        tables = query_engine.get_table_names()
        print(f"[+] Connected to Supabase. Found {len(tables)} table(s).")
        for t in tables:
            row_count = query_engine.get_row_count(t)
            print(f"   [table] {t}: {row_count:,} rows")

        if not tables:
            print("[!] No tables found. Use POST /api/upload or run: python seed.py")
    except Exception as e:
        print(f"[!] Warning: Database initialization failed: {e}")

    yield

    print("[-] Shutting down...")
    try:
        query_engine.close()
    except Exception as e:
        print(f"[!] Error on shutdown: {e}")


app = FastAPI(
    title="BI Dashboard AI",
    description="Conversational AI for Instant Business Intelligence Dashboards",
    version="1.0.0",
    lifespan=lifespan
)

# CORS -- configurable origins (defaults to Vite dev server)
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

# Mount API routes
app.include_router(router)


@app.get("/")
async def root():
    return {
        "message": "BI Dashboard AI Backend",
        "docs": "/docs",
        "health": "/api/health"
    }
