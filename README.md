# 🧠 BI Dashboard AI

> **Conversational AI for Instant Business Intelligence Dashboards**
>
> Turn natural language questions into interactive, real-time data dashboards — no SQL or BI tools required.

![Built with](https://img.shields.io/badge/Built%20with-React%20%7C%20FastAPI%20%7C%20Llama%203.3-blueviolet?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)

---

## 🎯 Problem Statement

Non-technical executives need data dashboards but lack SQL or BI tool expertise. This creates a bottleneck where data teams are overwhelmed with basic reporting requests, and business users wait days for simple insights.

**BI Dashboard AI** solves this by allowing anyone to generate fully functional, interactive dashboards using plain English.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗣️ **Natural Language Queries** | Type any business question in plain English |
| 📊 **Smart Chart Selection** | AI automatically picks the best chart type (Bar, Line, Pie, Area, Scatter) |
| 🧠 **AI Insights** | Automated business insights alongside every dashboard |
| 💬 **Follow-up Questions** | Chat with your dashboard — filter, drill down, or modify charts conversationally |
| 📁 **CSV Upload** | Upload your own dataset and start querying instantly |
| ⚡ **Real-time** | Dashboards generated in ~1-2 seconds via Groq's fast inference |
| 🎨 **Premium UI** | Dark theme, glassmorphism, smooth animations, responsive design |
| 🛡️ **Hallucination Prevention** | System refuses to fabricate data — reports what it can't answer |

---

## 🏗️ Architecture

```
User Prompt → React Frontend → FastAPI Backend → Groq/Llama 3.3 LLM
                                                        ↓
                                              SQL + Chart Config (JSON)
                                                        ↓
                                              SQLite Query Engine ← CSV Data
                                                        ↓
                                              Chart Data + Insights (JSON)
                                                        ↓
                                              Recharts Dashboard ← React Frontend
```

**Pipeline:** `Natural Language → LLM generates SQL + chart config → SQLite executes query → JSON response → Recharts renders interactive dashboard`

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Component-based UI |
| **Styling** | Tailwind CSS v4 | Dark theme, animations, glassmorphism |
| **Charts** | Recharts | Interactive Bar, Line, Pie, Area, Scatter charts |
| **Icons** | Lucide React | Lightweight icon library |
| **Backend** | FastAPI (Python) | Async REST API |
| **LLM** | Groq API (Llama 3.3 70B) | Natural language → SQL + chart configs |
| **Data** | Pandas + SQLite (in-memory) | CSV loading and SQL query execution |

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variable template
│   ├── core/
│   │   ├── llm.py                 # Groq/Llama 3.3 API client
│   │   ├── query_engine.py        # CSV → SQLite loader + safe SQL executor
│   │   ├── schema.py              # Schema introspector for LLM context
│   │   └── prompts.py             # System prompt templates
│   ├── api/
│   │   ├── routes.py              # API endpoints
│   │   └── models.py              # Pydantic request/response models
│   ├── data/
│   │   └── Amazon Sales.csv       # Amazon e-commerce dataset (50K rows)
│   └── uploads/                   # User-uploaded CSVs
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component
│   │   ├── index.css              # Tailwind v4 theme + animations
│   │   ├── components/
│   │   │   ├── ChatInput.jsx      # Natural language input
│   │   │   ├── ChartRenderer.jsx  # Dynamic chart factory
│   │   │   ├── Dashboard.jsx      # Dashboard container
│   │   │   ├── InsightCard.jsx    # AI insights display
│   │   │   ├── LoadingState.jsx   # Animated loading UI
│   │   │   ├── FileUpload.jsx     # CSV drag-and-drop upload
│   │   │   └── ChatHistory.jsx    # Conversation thread
│   │   └── utils/
│   │       ├── api.js             # API client functions
│   │       └── chartHelpers.js    # Chart color palette + data pivot
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Groq API Key** (free at [console.groq.com](https://console.groq.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/sbr69/BI_Agent.git
cd BI_Agent
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your Groq API key:
# GROQ_API_KEY=gsk_your_key_here

# Start the server
python -m uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:5173** in your browser.

---

## 📊 Dataset

The app comes pre-loaded with an **Amazon E-Commerce Sales** dataset (50,000 transactions):

| Column | Type | Description |
|---|---|---|
| `order_id` | Integer | Unique transaction ID |
| `order_date` | Date | Transaction date (2022–2023) |
| `product_category` | String | Books, Fashion, Electronics, Sports, Beauty, Home & Kitchen |
| `price` | Float | Original base price |
| `discount_percent` | Integer | Discount applied (0–30%) |
| `quantity_sold` | Integer | Units purchased |
| `customer_region` | String | Asia, Europe, Middle East, North America |
| `payment_method` | String | UPI, Credit Card, Debit Card, Wallet, Cash on Delivery |
| `rating` | Float | Product rating (1.0–5.0) |
| `review_count` | Integer | Number of reviews |
| `total_revenue` | Float | Final revenue (discounted_price × quantity) |

---

## 💡 Example Queries

### Simple
> "Show me total revenue by customer region"
→ Bar chart with 4 regions

### Medium
> "Monthly sales trends for 2023 by product category"
→ Multi-line chart, 6 categories across 12 months

### Complex
> "Compare Q1 and Q2 2023 performance by region and highlight top categories"
→ Multiple charts: grouped bars + insights

### Follow-up
> "Now filter this to only show Asia and Europe"
→ AI modifies previous query, shows filtered results

### Error Handling
> "What is the weather today?"
→ Graceful error: "This dataset is about Amazon sales and does not contain weather data"

---

## 🏆 Evaluation Criteria Coverage

| Criteria | Score Focus | Implementation |
|---|---|---|
| **Data Retrieval** | 40% Accuracy | LLM generates correct SQL; validated against SQLite |
| **Chart Selection** | 40% Accuracy | System prompt rules: time→line, category→bar, distribution→pie |
| **Error Handling** | 40% Accuracy | Graceful errors for out-of-scope, hallucination prevention |
| **Design** | 30% UX | Dark theme, glassmorphism, gradient accents, Inter font |
| **Interactivity** | 30% UX | Tooltips, legends, hover states, responsive charts |
| **User Flow** | 30% UX | Loading animations, example prompts, auto-scroll |
| **Architecture** | 30% Innovation | Clean pipeline: NL → LLM → SQL → SQLite → JSON → Recharts |
| **Prompt Engineering** | 30% Innovation | Schema-aware prompts, chart rules, hallucination guards |
| **Follow-up Questions** | Bonus +10 | Session-based conversation history |
| **CSV Upload** | Bonus +20 | Upload any CSV, query immediately |

---

## 🔒 Safety & Hallucination Prevention

- **Read-only SQL**: Write operations (INSERT, UPDATE, DELETE, DROP) are blocked
- **Schema validation**: LLM only generates SQL using columns that exist
- **Error reporting**: Returns helpful errors instead of fabricating data
- **Input validation**: Pydantic models validate all API requests/responses

---

## 📜 License

MIT License

---

## 👥 Team

Built for the GFG Hackathon — Conversational AI for Instant Business Intelligence Dashboards.
