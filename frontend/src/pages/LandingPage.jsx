import { Link } from "react-router-dom";
import {
  BarChart3,
  Bot,
  Database,
  TrendingUp,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  LineChart,
  PieChart,
  Upload,
  MessageSquare,
  Star,
} from "lucide-react";

const NAV_LINKS = ["Features", "How It Works", "About"];

const FEATURES = [
  {
    icon: Bot,
    title: "AI-Powered Queries",
    desc: "Ask questions in plain English. Our LLM transforms them into precise SQL queries and returns instant insights.",
    color: "text-primary",
    bg: "bg-primary-50",
  },
  {
    icon: BarChart3,
    title: "Interactive Charts",
    desc: "Automatically render bar, line, pie, area, and scatter charts. Export, zoom, and pin your favourites.",
    color: "text-info",
    bg: "bg-info-50",
  },
  {
    icon: Database,
    title: "Any CSV Dataset",
    desc: "Upload your own CSV files and start querying within seconds. No database setup required.",
    color: "text-success",
    bg: "bg-success-50",
  },
  {
    icon: TrendingUp,
    title: "KPI Dashboards",
    desc: "Get auto-generated KPI cards and trend indicators that surface the metrics that matter most.",
    color: "text-warning",
    bg: "bg-warning-50",
  },
  {
    icon: MessageSquare,
    title: "Contextual Follow-ups",
    desc: "Continue a conversation with follow-up questions. The AI remembers your session context.",
    color: "text-error",
    bg: "bg-error-50",
  },
  {
    icon: Shield,
    title: "Query History",
    desc: "Every query is saved. Re-run, review, and build on past analysis without starting over.",
    color: "text-accent",
    bg: "bg-warning-50",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Upload,
    title: "Upload Your Data",
    desc: "Drag and drop any CSV file. The engine loads it instantly and infers your schema automatically.",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Ask a Question",
    desc: 'Type a question like "What were the top 10 products by revenue last month?" in plain English.',
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Get Instant Insights",
    desc: "Receive KPI cards, beautiful charts, and AI-written narrative insights in seconds.",
  },
];

const STATS = [
  { value: "50K+", label: "Sample rows included" },
  { value: "6+", label: "Chart types supported" },
  { value: "<2s", label: "Average query time" },
  { value: "100%", label: "Natural language" },
];

const CHECKS = [
  "No SQL knowledge required",
  "Works with any CSV structure",
  "Charts auto-generated",
  "AI narrative insights",
  "Pin & export results",
  "Full query history",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <BarChart3 size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-text-primary tracking-tight">
              BI <span className="text-primary">Agent</span>
            </span>
          </Link>

          {/* Nav links — hidden on small screens */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(" ", "-")}`}
                className="text-sm text-text-secondary hover:text-primary transition-colors"
              >
                {l}
              </a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary border border-border rounded-lg hover:border-primary-200 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        {/* subtle bg decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-50 opacity-60 blur-3xl" />
          <div className="absolute top-40 -left-24 w-72 h-72 rounded-full bg-warning-50 opacity-50 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary">
            <Zap size={12} />
            Powered by Llama 3.3 70B via Groq
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary leading-tight tracking-tight">
            Business Intelligence,{" "}
            <span className="text-primary">Simplified</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto text-base md:text-lg text-text-secondary leading-relaxed">
            Upload a CSV, ask questions in plain English, and get instant charts,
            KPIs, and AI-written insights — no SQL, no setup, no nonsense.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3 bg-white border border-border hover:border-primary-200 text-text-primary rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
            >
              Sign in to dashboard <ChevronRight size={16} />
            </Link>
          </div>

          {/* Check-list pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {CHECKS.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-border rounded-full text-xs text-text-secondary"
              >
                <CheckCircle2 size={12} className="text-success" />
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative max-w-5xl mx-auto mt-16 animate-fade-in">
          <div className="card overflow-hidden shadow-2xl">
            {/* Mock topbar */}
            <div className="h-10 bg-white border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-text-muted">BI Agent — Dashboard</span>
            </div>
            {/* Mock content */}
            <div className="bg-surface p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: "$1.24M", trend: "+12.4%", up: true },
                { label: "Orders", value: "8,302", trend: "+5.1%", up: true },
                { label: "Avg. Order", value: "$149", trend: "-2.3%", up: false },
                { label: "Customers", value: "3,847", trend: "+18.7%", up: true },
              ].map((k) => (
                <div key={k.label} className="card p-4">
                  <p className="text-xs text-text-muted mb-1">{k.label}</p>
                  <p className="text-xl font-bold text-text-primary">{k.value}</p>
                  <p className={`text-xs font-medium mt-0.5 ${k.up ? "text-success" : "text-error"}`}>
                    {k.trend}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-surface px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* mock chart placeholder */}
              {[LineChart, BarChart3, PieChart].map((Icon, i) => (
                <div key={i} className="card p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-3 rounded-full animate-shimmer" />
                    <Icon size={14} className="text-text-muted" />
                  </div>
                  <div className="h-24 flex items-end gap-1.5">
                    {[40, 65, 45, 80, 55, 90, 70, 60, 85, 75].map((h, j) => (
                      <div
                        key={j}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background:
                            i === 0
                              ? "linear-gradient(to top, #F97316, #FB923C)"
                              : i === 1
                              ? "linear-gradient(to top, #3B82F6, #60A5FA)"
                              : "linear-gradient(to top, #22C55E, #4ADE80)",
                          opacity: 0.75,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* glow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary opacity-10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-y border-border py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Features</p>
            <h2 className="text-3xl font-bold text-text-primary">Everything you need to analyse data</h2>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              From raw CSV to boardroom-ready charts in under a minute.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5 card-hover transition-all">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon size={18} className={f.color} />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1.5">{f.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-white border-y border-border py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">How It Works</p>
            <h2 className="text-3xl font-bold text-text-primary">Three steps to insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center">
                    <s.icon size={22} className="text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{s.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-3xl mx-auto card p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-md">
            <Star size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Built for speed, not spreadsheets</h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
            BI Agent was built to give anyone — analyst, founder, or student — the power of a full BI suite
            without the complexity. Snap in a dataset, ask your questions, and let the AI do the heavy lifting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/signup"
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Create free account <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-border hover:border-primary-200 text-text-secondary text-sm font-medium rounded-xl transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BarChart3 size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-text-primary">
              BI <span className="text-primary">Agent</span>
            </span>
          </div>
          <p className="text-xs text-text-muted">© 2026 BI Agent. Built with React, FastAPI & Llama 3.3 70B.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-text-muted hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-xs text-text-muted hover:text-primary transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
