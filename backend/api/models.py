"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─── Request Models ───

class QueryRequest(BaseModel):
    """User's natural language query."""
    prompt: str = Field(..., min_length=1, max_length=2000, description="Natural language query")
    session_id: Optional[str] = Field(None, description="Session ID for follow-up context")
    dataset: Optional[str] = Field(None, description="Specific dataset/table to query")


class UploadRequest(BaseModel):
    """Metadata for CSV upload."""
    table_name: Optional[str] = Field(None, description="Custom table name for the uploaded CSV")


# ─── Response Models ───

class ColumnInfo(BaseModel):
    name: str
    type: str


class DatasetInfo(BaseModel):
    name: str
    row_count: int
    columns: list[ColumnInfo]


class ChartConfig(BaseModel):
    type: str  # bar, line, pie, area, scatter
    title: str
    description: str = ""
    data: list[dict] = []
    xKey: str = ""
    yKeys: list[str] = []
    groupBy: Optional[str] = None
    colorScheme: str = "default"


class QueryResponse(BaseModel):
    """Full response with charts, insights, and metadata."""
    charts: list[ChartConfig] = []
    insights: list[str] = []
    error: Optional[str] = None
    metadata: dict = {}


class DatasetsResponse(BaseModel):
    """List of available datasets."""
    datasets: list[DatasetInfo] = []


class UploadResponse(BaseModel):
    """Response after CSV upload."""
    success: bool
    table_name: str = ""
    row_count: int = 0
    columns: list[ColumnInfo] = []
    message: str = ""


class HealthResponse(BaseModel):
    status: str = "ok"
    tables_loaded: int = 0
    total_rows: int = 0
