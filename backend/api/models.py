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
    date_from: Optional[str] = Field(None, description="Global date filter start (YYYY-MM-DD)")
    date_to: Optional[str] = Field(None, description="Global date filter end (YYYY-MM-DD)")


class PinRequest(BaseModel):
    """Request to pin/save a dashboard tile."""
    title: str = Field(..., min_length=1, max_length=200)
    query_prompt: str = Field(..., min_length=1)
    charts: list[dict] = []
    kpis: list[dict] = []
    insights: list[str] = []
    dataset: Optional[str] = None


class ScheduleRequest(BaseModel):
    """Request to schedule a recurring report."""
    title: str = Field(..., min_length=1, max_length=200)
    prompt: str = Field(..., min_length=1, max_length=2000)
    dataset: Optional[str] = None
    cron: str = Field(..., description="Cron expression (e.g., '0 9 * * 1' for weekly Monday 9am)")
    email: Optional[str] = Field(None, description="Email to send report to")


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


class KPIConfig(BaseModel):
    label: str
    value: str
    change: Optional[str] = None
    trend: Optional[str] = None  # "up", "down", "neutral"


class QueryResponse(BaseModel):
    """Full response with charts, insights, KPIs, and metadata."""
    charts: list[ChartConfig] = []
    kpis: list[KPIConfig] = []
    insights: list[str] = []
    error: Optional[str] = None
    metadata: dict = {}


class PinnedDashboard(BaseModel):
    """A saved/pinned dashboard tile."""
    id: str
    title: str
    query_prompt: str
    charts: list[ChartConfig] = []
    kpis: list[KPIConfig] = []
    insights: list[str] = []
    dataset: Optional[str] = None
    created_at: str


class ScheduledReport(BaseModel):
    """A scheduled recurring report."""
    id: str
    title: str
    prompt: str
    dataset: Optional[str] = None
    cron: str
    email: Optional[str] = None
    created_at: str
    last_run: Optional[str] = None
    active: bool = True


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
