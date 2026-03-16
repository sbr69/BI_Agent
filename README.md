<p align="center">
  <img src="https://img.shields.io/badge/🧠_BI_Dashboard_AI-Conversational_Intelligence-667eea?style=for-the-badge&labelColor=1a1b2e" alt="BI Dashboard AI" />
</p>

<h3 align="center">Turn plain-English questions into interactive data dashboards — in seconds.</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/LLM-Llama_3.3_70B-FF6F00?style=flat-square&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-Inference-F55036?style=flat-square" />
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-example-queries">Example Queries</a> •
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## 📌 About The Project

In today's data-driven world, accessing business insights often requires technical skills like SQL or navigating complex BI tools. This creates a bottleneck — data teams are overwhelmed with basic reporting requests, and business users wait days for simple dashboards.

**BI Dashboard AI** eliminates this bottleneck entirely. It allows non-technical users (CXOs, managers, analysts) to generate fully functional, interactive data dashboards using only natural language prompts. No SQL. No BI tool expertise. Just ask a question and get a dashboard.

### How It Works

```
  "Show me monthly revenue trends for 2023 by product category"
                              │
                              ▼
                    ┌──────────────────┐
                    │  React Frontend  │  ← Natural language input + chart rendering
                    └────────┬─────────┘
                             │ HTTP POST /api/query
                             ▼
                    ┌──────────────────┐
                    │  FastAPI Backend │  ← Routes, validation, session management
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Groq / Llama 3.3 │  ← Generates SQL + chart configuration
                    └────────┬─────────┘
                             │ JSON: {sql_queries, charts, insights}
                             ▼
                    ┌──────────────────┐
                    │ SQLite (In-Mem)  │  ← Executes SQL safely on CSV data
                    └────────┬─────────┘
                             │ Query results
                             ▼
                    ┌──────────────────┐
                    │Recharts Dashboard│  ← Bar, Line, Pie, Area, Scatter charts
                    └──────────────────┘
```

---

## ✨ Features

<table>
  <tr>
    <td width="50%">

**Natural Language Queries**
Type any business question in plain English. The AI understands context, generates the right SQL, picks the best chart type, and renders an interactive dashboard — all in 1-2 seconds.

**Conversational Follow-ups**
Ask follow-up questions to drill down, filter, or modify your dashboard. The system maintains conversation history per session.

**CSV Upload**
Drag & drop your own CSV datasets and start querying them immediately. No setup required.

</td>
<td width="50%">

**Smart Chart Selection**
The AI automatically selects the most appropriate chart type based on your question:
- Time-series → Line / Area charts
- Category comparison → Bar charts
- Distribution / proportion → Pie charts
- Correlation analysis → Scatter plots

**Hallucination Prevention**
The system refuses to fabricate data. Out-of-scope questions get a helpful error instead of made-up answers. SQL injection attempts are blocked. Write operations are prohibited.

**Real-Time Performance**
Powered by Groq's inference engine, dashboards are generated in ~1-2 seconds end-to-end.

</td>
  </tr>
</table>

---

## Architecture

The application follows a clean, layered pipeline architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│   ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐   │
│   │ ChatInput│ │ChartRenderer │ │Dashboard │ │ FileUpload   │   │
│   │          │ │(Bar/Line/Pie/│ │(Grid +   │ │(Drag & Drop) │   │
│   │ + Example│ │ Area/Scatter)│ │ Metadata)│ │              │   │
│   │  Prompts │ │              │ │          │ │              │   │
│   └──────────┘ └──────────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────────┐                                  │
│  │  Chat    │ │  Loading     │    Tailwind v4 + Glassmorphism   │
│  │ History  │ │  State       │    Dark Theme + Animations       │
│  └──────────┘ └──────────────┘                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────▼──────────────────────────────────────┐
│                       BACKEND (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Layer: /health, /datasets, /query, /upload, /session│   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────┐  ┌────────────▼────────┐  ┌──────────────────┐    │
│  │ Prompts  │  │    LLM Client       │  │  Query Engine    │    │
│  │ (System  │──│ (Groq / Llama 3.3)  │──│ (CSV → SQLite)   │    │
│  │  + Rules)│  │  NL → SQL + Charts  │  │  Safe Execution  │    │
│  └──────────┘  └─────────────────────┘  └──────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Schema Introspector: auto-detects columns, types, stats │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **In-memory SQLite** | Zero-config, fast queries on CSV data without a database server |
| **Groq + Llama 3.3 70B** | Blazing fast inference (~500ms), high-quality SQL generation, free tier available |
| **Schema-aware prompts** | LLM receives column names, types, and sample values to generate accurate SQL |
| **Read-only SQL enforcement** | Write operations (INSERT, UPDATE, DELETE, DROP) are blocked at the engine level |
| **Session-based context** | Follow-up queries work by passing conversation history to the LLM |
| **Chart type rules in prompt** | Explicit rules (time→line, category→bar) ensure consistent chart selection |

---

## 📂 Project Structure

```
BI_Agent/
│
├── README.md                        # Project documentation
├── .gitignore                       # Git ignore rules
├── Amazon Sales.csv                 # Original dataset (50K rows)
│
├── backend/                         # Python FastAPI backend
│   ├── main.py                         # App entry point + lifespan
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example                    # Environment variable template
│   │
│   ├── core/                           # Business logic
│   │   ├── __init__.py
│   │   ├── llm.py                      # Groq API client + JSON parser
│   │   │                                 → Sends schema + prompt to Llama 3.3
│   │   │                                 → Parses JSON response (SQL + charts)
│   │   │                                 → Validates chart types and structure
│   │   │
│   │   ├── query_engine.py             # Data engine
│   │   │                                 → Loads CSVs into in-memory SQLite
│   │   │                                 → Handles binary preamble detection
│   │   │                                 → Blocks write/destructive SQL
│   │   │                                 → Executes queries safely
│   │   │
│   │   ├── schema.py                   # Schema introspector
│   │   │                                 → Auto-detects column names & types
│   │   │                                 → Generates schema descriptions for LLM
│   │   │
│   │   └── prompts.py                  # Prompt engineering
│   │                                     → System prompt with chart rules
│   │                                     → Follow-up prompt with history
│   │                                     → Hallucination prevention guards
│   │
│   ├── api/                            # REST API layer
│   │   ├── __init__.py
│   │   ├── routes.py                   # Endpoint handlers
│   │   │                                 → GET  /api/health
│   │   │                                 → GET  /api/datasets
│   │   │                                 → POST /api/query
│   │   │                                 → POST /api/upload
│   │   │                                 → DEL  /api/session/{id}
│   │   │
│   │   └── models.py                   # Pydantic request/response schemas
│   │
│   ├── data/                           # Pre-loaded datasets
│   │   └── Amazon Sales.csv
│   │
│   └── uploads/                        # User-uploaded CSVs (gitignored)
│
└── frontend/                        # React + Vite frontend
    ├── index.html                      # Entry HTML (Inter font + meta)
    ├── package.json                    # Node dependencies
    ├── postcss.config.js               # Tailwind v4 PostCSS setup
    ├── vite.config.js                  # Vite configuration
    │
    └── src/
        ├── main.jsx                    # React root
        ├── App.jsx                     # Root component
        │                                → State management (session, datasets)
        │                                → API integration + error handling
        │                                → Layout: header, hero, chat, dashboard
        │
        ├── index.css                   # Design system
        │                                → Tailwind v4 @theme tokens
        │                                → Custom @utility classes (glass, shimmer)
        │                                → Animations (fade-in, pulse-glow)
        │                                → Recharts style overrides
        │
        ├── components/
        │   ├── ChatInput.jsx           # NL input + 6 example prompts
        │   ├── ChartRenderer.jsx       # Dynamic chart factory
        │   │                             → Bar, Line, Pie, Area, Scatter
        │   │                             → Auto-pivots grouped data
        │   │                             → Custom dark-themed tooltips
        │   ├── Dashboard.jsx           # Dashboard container + metadata bar
        │   ├── InsightCard.jsx         # AI insights with contextual icons
        │   ├── LoadingState.jsx        # Animated loading (brain + skeleton)
        │   ├── FileUpload.jsx          # Drag-and-drop CSV upload
        │   └── ChatHistory.jsx         # Conversation thread display
        │
        └── utils/
            ├── api.js                  # HTTP client (query, datasets, upload)
            └── chartHelpers.js         # Colors, data pivot, number formatting
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend tooling |
| Groq API Key | Free | LLM inference ([console.groq.com](https://console.groq.com/)) |

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/sbr69/BI_Agent.git
cd BI_Agent
```

**2. Backend setup**
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
# Edit .env → add your Groq API key:
#   GROQ_API_KEY=gsk_your_key_here

# Start the server
python -m uvicorn main:app --reload --port 8000
```
> You should see: `Loaded 1 table(s) with 50,000 total rows`

**3. Frontend setup**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
> You should see: `VITE ready — Local: http://localhost:5173/`

**4. Open the app**

Navigate to **http://localhost:5173** and start asking questions!

---

## Example Queries

<table>
<tr>
<th>Complexity</th>
<th>Prompt</th>
<th>Output</th>
</tr>
<tr>
<td>Simple</td>
<td><code>Show me total revenue by customer region</code></td>
<td>Bar chart → 4 regions (~$8M each)</td>
</tr>
<t
<td>Simple</td>
<td><code>What's the most popular payment method?</code></td>
<td>Bar chart → payment method distribution</td>
</tr>
<tr>
<td>Medium</td>
<td><code>Monthly sales trends for 2023 by product category</code></td>
<td>Multi-line chart → 6 categories × 12 months</td>
</tr>
<tr>
<td>Medium</td>
<td><code>Average rating by product category and region</code></td>
<td>Grouped bar chart → 24 data points</td>
</tr>
<tr>
<td>Complex</td>
<td><code>Compare monthly revenue for Electronics vs Fashion in 2023 and show growth</code></td>
<td>2 charts: line (trends) + bar (growth)</td>
</tr>
<tr>
<td>Follow-up</td>
<td><code>Now filter this to only show Asia and Europe</code></td>
<td>AI modifies previous query → filtered results</td>
</tr>
<tr>
<td>Error</td>
<td><code>What is the weather today?</code></td>
<td>Graceful error: "dataset doesn't contain weather data"</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Component-based, fast HMR, modern tooling |
| **Styling** | Tailwind CSS v4 | Utility-first, `@theme` tokens, `@utility` custom classes |
| **Charts** | Recharts | Declarative, responsive, React-native chart library |
| **Icons** | Lucide React | Lightweight, tree-shakable icon set |
| **Backend** | FastAPI | Async, auto-docs, Pydantic validation |
| **LLM** | Groq API (Llama 3.3 70B) | Fast inference (~500ms), high-quality SQL generation |
| **Data** | Pandas + SQLite | CSV parsing + in-memory SQL execution |

---

## 📊 Dataset

The app comes pre-loaded with an **Amazon E-Commerce Sales** dataset containing **50,000 transactions** spanning 2022–2023.

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

> You can upload your own CSV via the **Upload CSV** button in the header.

---

## Safety & Security

| Protection | Implementation |
|---|---|
| **Read-only SQL** | `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER` are blocked at the query engine level |
| **SQL injection** | LLM output is validated; destructive patterns are rejected before execution |
| **Schema validation** | LLM only generates SQL using columns that actually exist in the dataset |
| **No hallucination** | Out-of-scope questions return helpful errors instead of fabricated answers |
| **Input validation** | All API requests are validated via Pydantic models |
| **CORS** | Configured for local development; restrict origins for production |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server status, loaded tables, total rows |
| `GET` | `/api/datasets` | List all datasets with schema info |
| `POST` | `/api/query` | Process natural language query → dashboard JSON |
| `POST` | `/api/upload` | Upload a CSV file to query |
| `DELETE` | `/api/session/{id}` | Clear conversation history for a session |

### POST `/api/query` — Request

```json
{
  "prompt": "Show me total revenue by region",
  "session_id": "optional_session_id",
  "dataset": "amazon_sales"
}
```

### POST `/api/query` — Response

```json
{
  "charts": [
    {
      "type": "bar",
      "title": "Total Revenue by Customer Region",
      "description": "Revenue across 4 regions",
      "data": [
        { "customer_region": "Asia", "total_rev": 8175199.83 },
        { "customer_region": "Europe", "total_rev": 8112311.57 }
      ],
      "xKey": "customer_region",
      "yKeys": ["total_rev"],
      "groupBy": null,
      "colorScheme": "default"
    }
  ],
  "insights": [
    "Asia has the highest total revenue among all regions"
  ],
  "error": null,
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


