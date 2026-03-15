"""
FastAPI Application — entry point for the BI Dashboard backend.
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

# Data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the query engine on startup."""
    print("🚀 Starting BI Dashboard Backend...")

    # Initialize query engine and load all CSVs from data/
    query_engine.initialize(DATA_DIR)

    tables = query_engine.get_table_names()
    total_rows = sum(len(query_engine.tables[t]) for t in tables)
    print(f"✅ Loaded {len(tables)} table(s) with {total_rows:,} total rows")
    for t in tables:
        print(f"   📊 {t}: {len(query_engine.tables[t]):,} rows")

    # Also load any previously uploaded CSVs
    if os.path.isdir(UPLOADS_DIR):
        for filename in os.listdir(UPLOADS_DIR):
            if filename.lower().endswith(".csv"):
                filepath = os.path.join(UPLOADS_DIR, filename)
                try:
                    query_engine.load_csv(filepath)
                    print(f"   📁 (upload) {filename}: loaded")
                except Exception as e:
                    print(f"   ⚠️  (upload) {filename}: failed - {e}")

    yield

    print("👋 Shutting down...")


app = FastAPI(
    title="BI Dashboard AI",
    description="Conversational AI for Instant Business Intelligence Dashboards",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
