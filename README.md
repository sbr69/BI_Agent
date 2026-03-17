<p align="center">
  <img src="https://img.shields.io/badge/🧠_BI_Agent-Conversational_Intelligence-F97316?style=for-the-badge&labelColor=1a1b2e" alt="BI Agent" />
</p>

<h3 align="center">Ask questions in plain English. Get interactive dashboards in seconds.</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/LLM-Llama_3.3_70B-FF6F00?style=flat-square&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-Inference-F55036?style=flat-square" />
</p>

<p align="center">
  <a href="#-about-the-project">About</a> •
  <a href="#-problem-statement">Problem</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-demo--example-queries">Demo</a> •
  <a href="#-api-reference">API</a>
</p>

---

## 📌 About The Project

**BI Agent** is an AI-powered Business Intelligence platform that transforms natural language questions into fully interactive, data-driven dashboards. It combines the power of **Llama 3.3 70B** (via Groq) with a modern **React + FastAPI** stack and **Supabase PostgreSQL** to deliver real-time analytics — without requiring users to write a single line of SQL.

Upload any CSV dataset, ask a question in plain English, and receive **KPI cards, multi-chart dashboards, and AI-written narrative insights** in under 2 seconds.

> Built for the **GFG Hackathon 2026** — designed to democratize data analytics for non-technical stakeholders.

---

## 🎯 Problem Statement

In organizations of every size, the gap between *having data* and *understanding data* remains painfully wide:

| Pain Point | Impact |
|---|---|
| Business users depend on data teams for simple reports | Weeks of wait time for basic dashboards |
| SQL and BI tool expertise required | Only ~15% of employees can self-serve analytics |
| Static reports lack interactivity | Insights go stale before they reach decision-makers |
| Setting up BI tools is complex and expensive | Small teams and startups are left behind |

**BI Agent solves all four.** Anyone — a CEO, a marketing manager, or a student — can upload a dataset and start getting insights immediately using nothing but natural language.

---

## ✨ Key Features

### Core Intelligence

| Feature | Description |
|---|---|
| **Natural Language → SQL → Charts** | The AI parses your question, generates PostgreSQL-compliant SQL, selects the optimal chart type, and renders an interactive dashboard — end to end. |
| **Conversational Follow-ups** | Ask follow-up questions like *"now filter this to Asia only"* — the system maintains session context and modifies queries accordingly. |
| **KPI Auto-Generation** | Every query response includes dynamically computed KPI cards (totals, averages, trends) with human-readable formatting ($1.24M, 8.3K). |
| **AI-Written Insights** | The LLM generates narrative insights alongside charts, surfacing patterns and anomalies that raw data alone cannot convey. |
| **Hallucination Prevention** | Out-of-scope questions receive informative errors. The LLM is schema-constrained — it cannot reference columns or tables that do not exist. |

### Visualization & Dashboard

| Feature | Description |
|---|---|
| **6 Chart Types** | Bar, Line, Pie, Area, Scatter, and interactive Data Tables — auto-selected based on query semantics. |
| **Data Point Highlights** | The AI can annotate noteworthy data points (e.g., top region, outlier) with custom colors and labels directly on charts. |
| **Dashboard Pinning** | Save any AI-generated dashboard for later review. Pins persist across sessions and are accessible from the main dashboard. |
| **CSV/PDF Export** | Export chart data as CSV or generate PDF snapshots of the full dashboard. |
| **Date Range Filtering** | Global date filter with presets (7 days, 30 days, quarter) that propagates to all AI-generated SQL queries. |
| **Activity Heatmap** | GitHub-style heatmap showing query activity by weekday and hour across your session. |
| **Data Coverage Gauges** | Visual gauge rings indicating dataset completeness and column richness. |

### Data Management

| Feature | Description |
|---|---|
| **CSV Upload** | Drag-and-drop any CSV file. The engine auto-detects column types (numeric, text, date), infers the schema, and loads it into Supabase PostgreSQL. |
| **Multi-Dataset Support** | Upload multiple CSVs and switch between datasets from the global filter bar. Cross-dataset queries are isolated for security. |
| **Data Explorer** | Browse dataset schemas, preview raw rows, and inspect column types without writing any queries. |
| **Seed Script** | Bulk-import CSV files from the `data/` directory using `python seed.py` for quick setup. |

### Platform & Security

| Feature | Description |
|---|---|
| **User Authentication** | Sign up / sign in flow with profile management and protected routes. |
| **Query History** | Full history of every query with timestamps, prompts, and results. Re-run or review past analyses. |
| **Scheduled Reports** | Set up recurring reports with cron expressions and optional email delivery. |
| **API Key Authentication** | Optional `X-API-Key` header authentication for all non-public endpoints. |
| **Rate Limiting** | In-memory rate limiter (30 requests/minute per IP) to prevent abuse. |
| **Read-Only SQL Enforcement** | `INSERT`, `UPDATE`, `DELETE`, `DROP`, and 20+ other destructive keywords are blocked at the engine level. |
| **Function & Table Blocklists** | PostgreSQL system functions (`pg_read_file`, `dblink`, etc.) and catalog tables (`pg_shadow`, `pg_roles`, etc.) are explicitly blocked. |
| **Statement Timeout** | 30-second query timeout to prevent runaway queries from consuming resources. |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND  (React 19 + Vite 8)                      │
│                                                                            │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐   │
│  │ Landing │  │  Dashboard │  │  Query   │  │  Explorer │  │  Upload   │   │
│  │  Page   │  │    Page    │  │   Page   │  │   Page    │  │   Page    │   │
│  └─────────┘  └────────────┘  └──────────┘  └───────────┘  └───────────┘   │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐                                 │
│  │  Login  │  │   Signup   │  │ History  │  Protected Routes + Layout      │
│  │  Page   │  │    Page    │  │   Page   │  Sidebar + TopBar + Search      │
│  └─────────┘  └────────────┘  └──────────┘                                 │
│                                                                            │
│  Components: ChartRenderer · KPICards · DataTable · FileUpload             │
│              InsightCard · LoadingState · Layout (Sidebar + TopBar)        │
│  Styling:    Tailwind CSS v4 · Glassmorphism · Animations · Dark accents   │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │  REST API (JSON)
┌───────────────────────────────▼────────────────────────────────────────────┐
│                         BACKEND  (FastAPI 0.115)                           │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  API Layer (19 endpoints)                                           │   │
│  │  /health · /datasets · /query · /upload · /preview/{dataset}        │   │
│  │  /export/chart-csv · /pins (CRUD) · /schedules (CRUD) · /session    │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                           │
│  ┌────────────┐  ┌─────────────▼──────────┐  ┌─────────────────────────┐   │
│  │   Prompt   │  │      LLM Client        │  │     Query Engine        │   │
│  │  Engineer  │──│  Groq / Llama 3.3 70B  │──│  CSV → PostgreSQL       │   │
│  │  (System + │  │  NL → SQL + Charts     │  │  Connection Pooling     │   │
│  │  Follow-up │  │  JSON Parsing          │  │  Read-Only Enforcement  │   │
│  │  Prompts)  │  │  KPI + Insight Gen     │  │  SQL Injection Guard    │   │
│  └────────────┘  └────────────────────────┘  └─────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Schema Introspector: column names, types, sample values, ranges    │   │
│  │  Cached (5 min TTL) · Auto-invalidates on new upload                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Middleware: CORS · API Key Auth · Rate Limiting (30 req/min)              │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────────────┐
│                     SUPABASE  (PostgreSQL)                                 │
│  Managed cloud database · Connection pooling · Row-level security          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User types: "Show monthly revenue by category for 2023"
    │
    ▼
[ React Frontend ] ──POST /api/query──▶ [ FastAPI Backend ]
                                              │
                                    ┌─────────▼──────────┐
                                    │ Schema Introspector│
                                    │ (column names,     │
                                    │  types, samples)   │
                                    └─────────┬──────────┘
                                              │ schema context
                                    ┌─────────▼──────────┐
                                    │ Prompt Builder     │
                                    │ (system + history  │
                                    │  + date filters)   │
                                    └─────────┬──────────┘
                                              │ structured prompt
                                    ┌─────────▼──────────┐
                                    │ Groq API           │
                                    │ Llama 3.3 70B      │
                                    │ (~500ms inference) │
                                    └─────────┬──────────┘
                                              │ JSON: {sql_queries, charts, kpis, insights}
                                    ┌─────────▼──────────┐
                                    │ Query Engine       │
                                    │ Validates SQL      │
                                    │ Executes on PgSQL  │
                                    │ Returns results    │
                                    └─────────┬──────────┘
                                              │ chart data + KPI values
    ┌─────────────────────────────────────────▼───────┐
    │ Frontend renders: KPI cards + Charts + Insights │
    └─────────────────────────────────────────────────┘
```
  
### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Supabase PostgreSQL** | Managed cloud database with connection pooling — eliminates DB ops overhead while supporting full SQL expressiveness. |
| **Groq + Llama 3.3 70B** | ~500ms inference, high-quality SQL generation, and a generous free tier. Outperforms GPT-3.5 on structured output tasks. |
| **Schema-aware prompting** | The LLM receives column names, types, sample values, and unique value enumerations — dramatically reducing hallucination. |
| **Threaded connection pool** | `psycopg2.ThreadedConnectionPool(1, 10)` ensures concurrent queries don't block each other while limiting DB connections. |
| **Read-only + table allowlist** | Defense-in-depth: 20+ blocked keywords, function blocklist, system catalog blocklist, and per-query table allowlist. |
| **Session-based follow-ups** | Last 5 conversation entries are injected into follow-up prompts, enabling multi-turn analytical sessions. |
| **Chart type rules in prompt** | Explicit mapping (time → line, category → bar, distribution → pie) ensures deterministic, appropriate visualizations. |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | Component architecture, state management |
| Vite | 8 | Build tooling, HMR, dev server |
| Tailwind CSS | v4 | Utility-first styling with `@theme` tokens |
| Recharts | 3.8 | Declarative, responsive chart library |
| React Router | v7 | Client-side routing, protected routes |
| Lucide React | 0.577 | Lightweight, tree-shakable icon set |
| html2canvas + jsPDF | — | Client-side PDF export |
| @hello-pangea/dnd | 18 | Drag-and-drop interactions |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.115 | Async API framework with auto-docs |
| Uvicorn | 0.34 | ASGI server |
| psycopg2 | 2.9 | PostgreSQL adapter with connection pooling |
| Groq SDK | 0.25 | LLM inference client |
| Pydantic | v2 | Request/response validation |
| python-dotenv | 1.0 | Environment variable management |

### Infrastructure

| Service | Purpose |
|---|---|
| Supabase | Managed PostgreSQL database (cloud) |
| Groq Cloud | LLM inference API |

---

## 📂 Project Structure

```
BI_Agent/
│
├── README.md
├── .gitignore
│
├── backend/                          # Python FastAPI backend
│   ├── main.py                          # App entry + lifespan + middleware
│   ├── requirements.txt                 # Python dependencies
│   ├── seed.py                          # Bulk CSV import script
│   ├── .env.example                     # Environment variable template
│   │
│   ├── core/                            # Business logic layer
│   │   ├── llm.py                          # Groq API client, JSON extraction, response validation
│   │   ├── query_engine.py                 # PostgreSQL connection pooling, CSV loader, SQL executor
│   │   ├── schema.py                       # Schema introspector with 5-min cache
│   │   └── prompts.py                      # System + follow-up prompt templates
│   │
│   ├── api/                             # REST API layer
│   │   ├── routes.py                       # 19 endpoint handlers
│   │   └── models.py                       # Pydantic request/response schemas
│   │
│   ├── data/                            # Pre-loaded sample datasets
│   │   └── Amazon Sales.csv                # 50K e-commerce transactions
│   │
│   └── uploads/                         # User-uploaded CSVs (gitignored)
│
└── frontend/                         # React + Vite frontend
    ├── index.html                       # Entry HTML
    ├── package.json                     # Node dependencies
    ├── vite.config.js                   # Vite configuration
    │
    └── src/
        ├── App.jsx                      # Root component + routing
        ├── main.jsx                     # React DOM root
        ├── index.css                    # Tailwind v4 design system
        │
        ├── pages/
        │   ├── LandingPage.jsx             # Marketing landing page
        │   ├── LoginPage.jsx               # Authentication - sign in
        │   ├── SignupPage.jsx              # Authentication - sign up
        │   ├── DashboardPage.jsx           # Main analytics dashboard (1200+ lines)
        │   ├── QueryPage.jsx               # AI query interface
        │   ├── ExplorerPage.jsx            # Dataset schema browser
        │   ├── HistoryPage.jsx             # Query history viewer
        │   ├── UploadPage.jsx              # CSV upload interface
        │   └── ProfilePage.jsx             # User profile management
        │
        ├── components/
        │   ├── ChartRenderer.jsx           # Dynamic chart factory (6 types)
        │   ├── KPICards.jsx                # KPI card strip with trends
        │   ├── DataTable.jsx               # Interactive data table
        │   ├── FileUpload.jsx              # Drag-and-drop CSV upload
        │   ├── InsightCard.jsx             # AI insight display
        │   ├── LoadingState.jsx            # Animated skeleton loader
        │   ├── ProtectedRoute.jsx          # Auth route guard
        │   ├── RootRedirect.jsx            # Auth-based root redirect
        │   └── layout/
        │       ├── Layout.jsx                 # App shell + context provider
        │       ├── Sidebar.jsx                # Navigation sidebar
        │       └── TopBar.jsx                 # Top bar with search + filters
        │
        └── utils/
            ├── api.js                      # HTTP client (query, datasets, upload, export)
            ├── chartHelpers.js             # Color palettes, data pivot, number formatting
            └── constants.js                # Example prompts, profile helpers
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build tooling |
| Groq API Key | Free | LLM inference ([console.groq.com](https://console.groq.com/)) |
| Supabase Project | Free | PostgreSQL database ([supabase.com](https://supabase.com/)) |

### 1. Clone the Repository

```bash
git clone https://github.com/sbr69/BI_Agent.git
cd BI_Agent
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `.env` with your credentials:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
SUPABASE_DB_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
BI_API_KEY=your_optional_api_key
```

Seed the database with sample data (one-time):

```bash
python seed.py
```

Start the backend server:

```bash
python -m uvicorn main:app --reload --port 8000
```

> You should see: `Connected to Supabase. Found 1 table(s).`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

> You should see: `VITE ready — Local: http://localhost:5173/`

### 4. Open the App

Navigate to **http://localhost:5173** — sign up, upload a dataset, and start asking questions.

---

## 🎬 Demo & Example Queries

| Complexity | Prompt | Expected Output |
|---|---|---|
| Simple | `Show me total revenue by customer region` | Bar chart with 4 regions + KPI cards |
| Simple | `What's the most popular payment method?` | Bar chart showing payment method distribution |
| Medium | `Monthly sales trends for 2023 by product category` | Multi-line chart — 6 categories × 12 months |
| Medium | `Average rating by product category and region` | Grouped bar chart with 24 data points |
| Complex | `Compare monthly revenue for Electronics vs Fashion in 2023 and show growth` | 2 charts: line (trends) + bar (growth %) |
| Follow-up | `Now filter this to only show Asia and Europe` | AI modifies previous SQL → filtered results |
| Out-of-scope | `What is the weather today?` | Graceful error: *"This dataset doesn't contain weather data"* |

---

## 📊 Sample Dataset

The project includes a pre-loaded **Amazon E-Commerce Sales** dataset with **50,000 transactions** spanning 2022–2023.

| Column | Type | Description |
|---|---|---|
| `order_id` | Integer | Unique transaction identifier |
| `order_date` | Date | Transaction date |
| `product_id` | Integer | Product identifier |
| `product_category` | String | Books, Fashion, Electronics, Sports, Beauty, Home & Kitchen |
| `price` | Float | Original base price ($) |
| `discount_percent` | Integer | Applied discount (0–30%) |
| `quantity_sold` | Integer | Units purchased per order |
| `customer_region` | String | Asia, Europe, Middle East, North America |
| `payment_method` | String | UPI, Credit Card, Debit Card, Wallet, Cash on Delivery |
| `rating` | Float | Product rating (1.0–5.0) |
| `review_count` | Integer | Number of reviews |
| `discounted_price` | Float | Price after discount |
| `total_revenue` | Float | Final revenue (discounted_price × quantity) |

> You can upload your own CSV files via the **Upload** page to start querying custom datasets.

---

## 🔒 Security Model

BI Agent implements defense-in-depth to ensure data safety even when an LLM is generating SQL:

| Layer | Protection |
|---|---|
| **Keyword Blocklist** | 20+ SQL keywords blocked: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `EXECUTE`, `DO`, etc. |
| **Function Blocklist** | Dangerous PostgreSQL functions blocked: `pg_read_file`, `dblink`, `lo_import`, `set_config`, `pg_terminate_backend`, etc. |
| **System Table Blocklist** | Access to `pg_shadow`, `pg_roles`, `pg_settings`, `information_schema`, and other catalog tables is denied. |
| **Table Allowlist** | Each query is restricted to only the target dataset — no cross-dataset data exfiltration is possible. |
| **SELECT-Only Enforcement** | Queries must begin with `SELECT` or `WITH`. Compound statements (containing `;`) are rejected. |
| **Read-Only Transactions** | `SET LOCAL default_transaction_read_only = ON` is set before every query execution. |
| **Statement Timeout** | 30-second timeout (`SET LOCAL statement_timeout`) prevents runaway queries. |
| **Result Row Cap** | Maximum 10,000 rows per query to prevent memory exhaustion. |
| **Input Validation** | All API requests are validated via Pydantic models with field constraints. |
| **Rate Limiting** | 30 requests per minute per IP address. |
| **CORS** | Configured for local development; restrict origins for production. |
| **API Key Auth** | Optional `X-API-Key` middleware for endpoint-level authentication. |

---

## 📡 API Reference

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status, loaded tables, total rows |
| `GET` | `/datasets` | List all datasets with schema info |
| `POST` | `/query` | Process natural language query → dashboard JSON |
| `POST` | `/upload` | Upload a CSV file to query |
| `GET` | `/preview/{dataset}` | Preview raw rows from a dataset (max 500) |
| `POST` | `/export/chart-csv` | Export chart data as downloadable CSV |
| `POST` | `/pins` | Save/pin a dashboard |
| `GET` | `/pins` | List all pinned dashboards |
| `DELETE` | `/pins/{pin_id}` | Remove a pinned dashboard |
| `POST` | `/schedules` | Create a scheduled report |
| `GET` | `/schedules` | List all schedules |
| `DELETE` | `/schedules/{id}` | Remove a schedule |
| `POST` | `/schedules/{id}/toggle` | Toggle schedule active/inactive |
| `GET` | `/session/{session_id}` | Get conversation history |
| `DELETE` | `/session/{session_id}` | Clear conversation history |

### POST `/api/query` — Request

```json
{
  "prompt": "Show me total revenue by region",
  "session_id": "optional_session_id",
  "dataset": "amazon_sales",
  "date_from": "2023-01-01",
  "date_to": "2023-12-31"
}
```

### POST `/api/query` — Response

```json
{
  "charts": [
    {
      "type": "bar",
      "title": "Total Revenue by Customer Region",
      "description": "Revenue distribution across 4 regions",
      "data": [
        { "customer_region": "Asia", "total_rev": 8175199.83 },
        { "customer_region": "Europe", "total_rev": 8112311.57 }
      ],
      "xKey": "customer_region",
      "yKeys": ["total_rev"],
      "highlights": [
        { "value": "Asia", "color": "#22C55E", "label": "Top Region" }
      ]
    }
  ],
  "kpis": [
    { "label": "Total Revenue", "value": "$32.4M", "trend": "up" },
    { "label": "Avg. Order Value", "value": "$149.20", "trend": "neutral" }
  ],
  "insights": [
    "Asia leads with the highest total revenue among all regions.",
    "Revenue is evenly distributed — no single region dominates."
  ],
  "metadata": {
    "query_time_ms": 787,
    "dataset": "amazon_sales",
    "queries_executed": 1,
    "rows_returned": 4,
    "session_id": "test"
  }
}
```

---

## 🤝 Team

| Member | Role |
|---|---|
| **sbr69** | Full-Stack Developer & AI Integration |

---

## 📜 License

This project is built for the **GFG Hackathon 2026**. All rights reserved.

---

<p align="center">
  <sub>Built with React, FastAPI, Supabase, and Llama 3.3 70B via Groq.</sub>
</p>
