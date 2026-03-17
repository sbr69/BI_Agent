import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppContext } from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  BarChart3, TrendingUp, TrendingDown, Database, Clock,
  MessageSquareText, ArrowRight, ArrowUpRight, Lightbulb,
  Zap, Pin, Trash2, Upload, Search, Activity, Layers,
  Target, Sparkles, FileText, Eye, ChevronRight, Calendar,
  RefreshCw, AlertTriangle, Server, ShieldCheck, HardDrive,
  Filter, Bell, Share2, Download, ChevronDown, Users,
  Table2, Bookmark, PlayCircle, PauseCircle, ExternalLink,
  CheckCircle2, XCircle, Info, Globe, Cpu, LayoutDashboard,
  Hash, Type, Copy, Link, FileDown, Image,
} from "lucide-react";
import ChartRenderer from "../components/ChartRenderer";
import KPICards from "../components/KPICards";
import { checkHealth, fetchSchedules } from "../utils/api";
import { CHART_COLORS } from "../utils/chartHelpers";
import { loadProfile, EXAMPLE_PROMPTS } from "../utils/constants";

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─── Greeting helper ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

/* ─── Mini sparkline for KPI cards ─── */
function MiniSparkline({ data, color, height = 36 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`} dot={false} isAnimationActive={true} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Section header component ─── */
function SectionHeader({ icon: Icon, title, subtitle, action, iconColor = "text-primary" }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Icon size={15} className={iconColor} />
          {title}
        </h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Custom tooltip ─── */
function DashTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg p-2.5 shadow-lg text-xs">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>
          {e.name}: <span className="font-medium">{Number(e.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Gauge / Progress Ring ─── */
function GaugeRing({ value, max, label, color, size = 80 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <p className="-mt-12 text-sm font-bold text-text-primary">{Math.round(pct)}%</p>
      <p className="text-[10px] text-text-muted mt-5 text-center">{label}</p>
    </div>
  );
}

/* ─── Heatmap cell ─── */
function HeatmapCell({ value, max }) {
  const intensity = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="w-full aspect-square rounded-sm transition-all hover:scale-110 cursor-default"
      style={{ backgroundColor: `rgba(249,115,22,${0.08 + intensity * 0.82})` }}
      title={`${value} queries`} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const {
    datasets, activeDataset, setActiveDataset,
    backendConnected, dashboardData, queryHistory,
    pinnedDashboards, removePin, refreshDatasets,
    dateFrom, setDateFrom, dateTo, setDateTo,
    sessionId,
  } = useAppContext();

  const navigate = useNavigate();
  const profile = loadProfile();
  const userName = profile?.name || "Analyst";

  /* ─── Local state ─── */
  const [liveTime, setLiveTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [healthData, setHealthData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [datePreset, setDatePreset] = useState("all");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllPins, setShowAllPins] = useState(false);
  const [shareToast, setShareToast] = useState("");

  /* ─── Live clock ─── */
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ─── Fetch backend health ─── */
  useEffect(() => {
    checkHealth().then(setHealthData).catch(() => setHealthData(null));
  }, []);

  /* ─── Fetch scheduled reports ─── */
  useEffect(() => {
    fetchSchedules().then(d => setSchedules(d.schedules || [])).catch(() => setSchedules([]));
  }, []);

  /* ─── Sync preset pill when TopBar clears/changes dates externally ─── */
  useEffect(() => {
    // If TopBar X button clears both dates, reset pill to "all"
    if (!dateFrom && !dateTo && datePreset !== "all") {
      setDatePreset("all");
    }
    // If both dates are set but don't match any preset, show "custom"
    if (dateFrom && dateTo) {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const matches7d = dateFrom === d7.toISOString().split("T")[0] && dateTo === todayStr;
      const matches30d = dateFrom === d30.toISOString().split("T")[0] && dateTo === todayStr;
      const matchesQ = dateFrom === qStart.toISOString().split("T")[0] && dateTo === todayStr;
      if (!matches7d && !matches30d && !matchesQ && datePreset !== "custom") {
        setDatePreset("custom");
      }
    }
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Date preset handler ─── */
  const handleDatePreset = useCallback((preset) => {
    setDatePreset(preset);
    const now = new Date();
    switch (preset) {
      case "7d": {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        setDateFrom(d.toISOString().split("T")[0]); setDateTo(now.toISOString().split("T")[0]);
        break;
      }
      case "30d": {
        const d = new Date(now); d.setDate(d.getDate() - 30);
        setDateFrom(d.toISOString().split("T")[0]); setDateTo(now.toISOString().split("T")[0]);
        break;
      }
      case "quarter": {
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        setDateFrom(qStart.toISOString().split("T")[0]); setDateTo(now.toISOString().split("T")[0]);
        break;
      }
      default:
        setDateFrom(""); setDateTo("");
    }
  }, [setDateFrom, setDateTo]);

  /* ─── Central date-filtered query history (used by all charts below) ─── */
  const dateFilteredHistory = useMemo(() => {
    if (!dateFrom && !dateTo) return queryHistory;
    return queryHistory.filter(q => {
      const ts = new Date(q.timestamp);
      const fromOk = dateFrom ? ts >= new Date(dateFrom) : true;
      // dateTo: include the whole day by comparing date-only strings
      const toOk = dateTo ? ts.toISOString().split("T")[0] <= dateTo : true;
      return fromOk && toOk;
    });
  }, [queryHistory, dateFrom, dateTo]);

  /* ─── Computed data ─── */
  const totalRows = useMemo(() =>
    datasets.reduce((sum, d) => sum + (d.row_count || 0), 0), [datasets]);

  const totalColumns = useMemo(() =>
    datasets.reduce((sum, d) => sum + (d.columns?.length || 0), 0), [datasets]);

  const columnTypeBreakdown = useMemo(() => {
    let numeric = 0, text = 0, dateC = 0;
    datasets.forEach(d => d.columns?.forEach(c => {
      const t = (c.type || "").toUpperCase();
      if (t.includes("INT") || t.includes("DOUBLE") || t.includes("NUMERIC") || t.includes("FLOAT")) numeric++;
      else if (t.includes("DATE") || t.includes("TIME")) dateC++;
      else text++;
    }));
    return { numeric, text, date: dateC, total: numeric + text + dateC };
  }, [datasets]);

  /* ─── KPI stats ─── */
  const stats = useMemo(() => [
    {
      label: "ACTIVE DATASETS", value: datasets.length, detail: datasets.length > 0 ? datasets.map(d => d.name).join(", ") : "No data yet",
      icon: Database, color: "#F97316", trend: "+Active", trendUp: true,
      sparkData: [{ value: 1 }, { value: 2 }, { value: 1 }, { value: 3 }, { value: 2 }, { value: datasets.length || 1 }],
    },
    {
      label: "TOTAL ROWS", value: totalRows.toLocaleString(), detail: datasets.length ? `Across ${datasets.length} dataset${datasets.length > 1 ? "s" : ""}` : "Upload data",
      icon: BarChart3, color: "#3B82F6", trend: "Loaded", trendUp: true,
      sparkData: [{ value: 10 }, { value: 25 }, { value: 20 }, { value: 38 }, { value: 30 }, { value: totalRows || 10 }],
    },
    {
      label: "COLUMNS", value: totalColumns, detail: `${columnTypeBreakdown.numeric} numeric · ${columnTypeBreakdown.text} text · ${columnTypeBreakdown.date} date`,
      icon: Layers, color: "#8B5CF6", trend: "Rich data", trendUp: true,
      sparkData: [{ value: 5 }, { value: 8 }, { value: 7 }, { value: 12 }, { value: 10 }, { value: totalColumns || 5 }],
    },
    {
      label: "QUERIES RUN",
      value: (dateFrom || dateTo) ? `${dateFilteredHistory.length} / ${queryHistory.length}` : queryHistory.length,
      detail: dateFilteredHistory.length ? `Last: ${dateFilteredHistory[0]?.prompt?.slice(0, 30)}...` : (dateFrom || dateTo) ? "No queries in range" : "No queries yet",
      icon: MessageSquareText, color: "#22C55E",
      trend: dateFilteredHistory.length > 0 ? "+Active" : "Idle", trendUp: dateFilteredHistory.length > 0,
      sparkData: [{ value: 0 }, { value: 1 }, { value: 3 }, { value: 2 }, { value: 5 }, { value: dateFilteredHistory.length }],
    },
    {
      label: "PINNED", value: pinnedDashboards.length, detail: pinnedDashboards.length ? "Saved dashboards" : "Pin results from AI Query",
      icon: Pin, color: "#EC4899", trend: pinnedDashboards.length > 0 ? "Saved" : "None", trendUp: pinnedDashboards.length > 0,
      sparkData: [{ value: 0 }, { value: 1 }, { value: 0 }, { value: 2 }, { value: 1 }, { value: pinnedDashboards.length }],
    },
    {
      label: "SCHEDULED", value: schedules.length, detail: schedules.filter(s => s.active).length + " active reports",
      icon: Calendar, color: "#14B8A6", trend: schedules.filter(s => s.active).length > 0 ? "Running" : "None", trendUp: schedules.length > 0,
      sparkData: [{ value: 0 }, { value: 0 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: schedules.length }],
    },
  ], [datasets, totalRows, totalColumns, columnTypeBreakdown, queryHistory, pinnedDashboards, schedules, dateFilteredHistory, dateFrom, dateTo]);

  /* ─── Activity chart: dynamic window based on date filter ─── */
  const activityChartData = useMemo(() => {
    const days = [];
    let cumulative = 0;
    // Determine the window: if date filter is set, use that range; otherwise last 7 days
    const toDate = dateTo ? new Date(dateTo) : new Date();
    const fromDate = dateFrom ? new Date(dateFrom) : (() => { const d = new Date(toDate); d.setDate(d.getDate() - 6); return d; })();
    // Build day-by-day buckets for the range (cap at 60 days to avoid perf issues)
    const msPerDay = 86400000;
    const diffDays = Math.min(60, Math.round((toDate - fromDate) / msPerDay) + 1);
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(fromDate); d.setDate(fromDate.getDate() + i);
      const key = diffDays <= 14
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const count = dateFilteredHistory.filter(q => {
        const qd = new Date(q.timestamp);
        return qd.toDateString() === d.toDateString();
      }).length;
      cumulative += count;
      days.push({ day: key, queries: count, cumulative });
    }
    return days;
  }, [dateFilteredHistory, dateFrom, dateTo]);

  /* ─── Activity Heatmap — filtered by date range ─── */
  const heatmapData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const grid = days.map(day => ({
      day,
      hours: hours.map(h => {
        const count = dateFilteredHistory.filter(q => {
          const d = new Date(q.timestamp);
          return d.getDay() === days.indexOf(day) && d.getHours() === h;
        }).length;
        return { hour: h, count };
      }),
    }));
    const maxCount = Math.max(1, ...grid.flatMap(d => d.hours.map(h => h.count)));
    return { grid, maxCount, hours };
  }, [dateFilteredHistory]);

  /* ─── AI-Generated Insights ─── */
  const aiInsights = useMemo(() => {
    const insights = [];
    // From last query result
    if (dashboardData?.insights?.length > 0) {
      dashboardData.insights.forEach(ins => insights.push({ type: "ai", text: ins }));
    }
    // Auto-generated from stats
    if (datasets.length > 0 && totalRows > 0) {
      const largest = datasets.reduce((a, b) => (a.row_count || 0) > (b.row_count || 0) ? a : b);
      insights.push({ type: "data", text: `Your largest dataset is "${largest.name}" with ${(largest.row_count || 0).toLocaleString()} rows.` });
    }
    if (columnTypeBreakdown.numeric > 0) {
      const pct = Math.round((columnTypeBreakdown.numeric / columnTypeBreakdown.total) * 100);
      insights.push({ type: "data", text: `${pct}% of your columns are numeric — your data is highly analysis-ready.` });
    }
    if (queryHistory.length > 5) {
      const uniqueDatasets = new Set(queryHistory.map(q => q.dataset).filter(Boolean));
      insights.push({ type: "usage", text: `You've queried ${uniqueDatasets.size} dataset(s) across ${queryHistory.length} queries this session.` });
    }
    if (queryHistory.length >= 3) {
      const avgCharts = queryHistory.reduce((s, q) => s + (q.result?.charts?.length || 0), 0) / queryHistory.length;
      insights.push({ type: "usage", text: `On average, each of your queries generates ${avgCharts.toFixed(1)} chart(s).` });
    }
    if (pinnedDashboards.length > 0) {
      insights.push({ type: "tip", text: `You have ${pinnedDashboards.length} pinned dashboard(s) — revisit them to track changes over time.` });
    }
    return insights.slice(0, 6);
  }, [dashboardData, datasets, totalRows, columnTypeBreakdown, queryHistory, pinnedDashboards]);

  const insightIcons = { ai: "🤖", data: "📊", usage: "📈", tip: "💡" };

  /* ─── Dataset distribution for pie chart ─── */
  const datasetDistribution = useMemo(() =>
    datasets.map((d, i) => ({
      name: d.name, value: d.row_count || 0, fill: CHART_COLORS[i % CHART_COLORS.length],
    })), [datasets]);

  /* ─── Column type distribution for pie chart ─── */
  const columnDistribution = useMemo(() => [
    { name: "Numeric", value: columnTypeBreakdown.numeric, fill: "#3B82F6" },
    { name: "Text", value: columnTypeBreakdown.text, fill: "#F97316" },
    { name: "Date", value: columnTypeBreakdown.date, fill: "#22C55E" },
  ].filter(c => c.value > 0), [columnTypeBreakdown]);

  /* ─── Search filtering ─── */
  const filteredPins = useMemo(() => {
    if (!searchQuery.trim()) return pinnedDashboards;
    const q = searchQuery.toLowerCase();
    return pinnedDashboards.filter(p =>
      p.title?.toLowerCase().includes(q) || p.query_prompt?.toLowerCase().includes(q));
  }, [pinnedDashboards, searchQuery]);

  const filteredHistory = useMemo(() => {
    // Start from date-filtered history, then apply search on top
    const base = dateFilteredHistory;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(h => h.prompt?.toLowerCase().includes(q));
  }, [dateFilteredHistory, searchQuery]);

  /* ─── Quick actions ─── */
  const quickActions = [
    { label: "Ask AI", desc: "Query data with natural language", icon: MessageSquareText, color: "from-orange-500 to-amber-500", path: "/query" },
    { label: "Upload Data", desc: "Import CSV files to analyze", icon: Upload, color: "from-blue-500 to-cyan-500", path: "/upload" },
    { label: "Explore Data", desc: "Browse schemas & preview rows", icon: Search, color: "from-green-500 to-emerald-500", path: "/explorer" },
    { label: "View History", desc: "Re-run or review past queries", icon: Clock, color: "from-purple-500 to-violet-500", path: "/history" },
  ];

  /* ─── AI-powered suggestions ─── */
  const suggestions = [
    { emoji: "📊", text: "Show me total revenue by region" },
    { emoji: "📈", text: "Monthly sales trends over time" },
    { emoji: "🏆", text: "Top 5 product categories by volume" },
    { emoji: "🔄", text: "Compare this quarter vs last quarter" },
    { emoji: "💎", text: "Customers with highest lifetime value" },
    { emoji: "🔍", text: "Show anomalies in the data" },
  ];

  /* ─── Share dashboard handler ─── */
  const handleShare = useCallback((type) => {
    switch (type) {
      case "link": {
        const url = window.location.href;
        navigator.clipboard?.writeText(url).then(() => {
          setShareToast("Dashboard link copied!");
          setTimeout(() => setShareToast(""), 2500);
        });
        break;
      }
      case "export": {
        const data = {
          exported_at: new Date().toISOString(),
          datasets: datasets.map(d => ({ name: d.name, rows: d.row_count, columns: d.columns?.length })),
          queries_run: queryHistory.length,
          pinned: pinnedDashboards.length,
          kpis: stats.map(s => ({ label: s.label, value: s.value })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bi_dashboard_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setShareToast("Dashboard exported!");
        setTimeout(() => setShareToast(""), 2500);
        break;
      }
    }
  }, [datasets, queryHistory, pinnedDashboards, stats]);

  /* ─── Alerts (mock — could come from backend) ─── */
  const alerts = useMemo(() => {
    const items = [];
    if (queryHistory.length > 10) {
      items.push({ type: "info", icon: Activity, title: "High activity", message: `You've run ${queryHistory.length} queries this session. Great engagement!`, time: "Now" });
    }
    if (datasets.length > 0) {
      items.push({ type: "success", icon: CheckCircle2, title: "Datasets loaded", message: `${datasets.length} dataset(s) connected and ready for analysis.`, time: "On load" });
    }
    if (!backendConnected) {
      items.push({ type: "error", icon: XCircle, title: "Connection lost", message: "Backend server is unreachable. Check your connection.", time: "Now" });
    }
    if (datasets.length === 0) {
      items.push({ type: "warning", icon: AlertTriangle, title: "No data loaded", message: "Upload a CSV file to start analyzing your data.", time: "Action needed" });
    }
    if (schedules.filter(s => s.active).length > 0) {
      items.push({ type: "info", icon: Calendar, title: "Reports scheduled", message: `${schedules.filter(s => s.active).length} automated report(s) are active.`, time: "Scheduled" });
    }
    return items;
  }, [queryHistory, datasets, backendConnected, schedules]);

  const alertColors = {
    info: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-900", sub: "text-blue-700", icon: "text-blue-500", time: "text-blue-500" },
    success: { bg: "bg-green-50", border: "border-green-100", text: "text-green-900", sub: "text-green-700", icon: "text-green-500", time: "text-green-500" },
    warning: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-900", sub: "text-orange-700", icon: "text-orange-500", time: "text-orange-500" },
    error: { bg: "bg-red-50", border: "border-red-100", text: "text-red-900", sub: "text-red-700", icon: "text-red-500", time: "text-red-500" },
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 animate-fade-in pb-8">

      {/* ══════════════════════════════════════════════════════════
          1. PERSONALIZED HERO HEADER
          ══════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border border-orange-200/50 p-6 md:p-8" id="hero-header">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-200/30 to-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Dashboard
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
              {getGreeting()}, {userName} 👋
            </h1>
            <p className="text-sm text-text-secondary mt-1.5 flex items-center gap-2">
              <Calendar size={14} className="text-text-muted" />
              {formatDate()} • {liveTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => { refreshDatasets(); checkHealth().then(setHealthData); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white/80 hover:bg-white text-text-secondary text-sm font-medium transition-all hover:shadow-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => navigate("/query")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg">
              <Sparkles size={14} /> New AI Query <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. GLOBAL FILTER BAR + SEARCH
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-border rounded-xl p-3 px-5 shadow-sm" id="global-filters">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={14} />
            <span className="font-medium text-xs hidden sm:inline">Filters:</span>
          </div>
          {/* Date preset pills */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            {[
              { key: "all", label: "All Time" },
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "quarter", label: "Quarter" },
              ...(datePreset === "custom" ? [{ key: "custom", label: "Custom" }] : []),
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => key !== "custom" && handleDatePreset(key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  datePreset === key
                    ? key === "custom"
                      ? "bg-blue-500 text-white"
                      : "bg-primary text-white"
                    : "bg-white text-text-secondary hover:bg-surface-light"
                }`}>
                {label}
              </button>
            ))}
          </div>
          {/* Active date range label */}
          {(dateFrom || dateTo) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[10px] text-blue-700 font-medium">
              <Calendar size={11} />
              {dateFrom || "…"} → {dateTo || "…"}
              <button onClick={() => handleDatePreset("all")} className="ml-1 hover:text-red-500 transition-colors" title="Clear date filter">
                ✕
              </button>
            </div>
          )}
          {/* Dataset selector */}
          <select
            value={activeDataset || ""}
            onChange={(e) => setActiveDataset(e.target.value)}
            className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary hover:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer">
            {datasets.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            {datasets.length === 0 && <option>No datasets</option>}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {/* Global search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text" placeholder="Search dashboards, queries..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs rounded-lg border border-border bg-surface-light hover:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/20 w-56 transition-colors"
            />
          </div>
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
            backendConnected
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}>
            {backendConnected ? <ShieldCheck size={13} /> : <XCircle size={13} />}
            {backendConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. HERO KPI STRIP (6 cards with sparklines)
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="kpi-strip">
        {stats.map((s, i) => (
          <div key={i}
            className="rounded-xl border border-border bg-white p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200 group cursor-default"
            style={{ borderTopColor: s.color, borderTopWidth: "2px" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                s.trendUp ? "text-green-600 bg-green-50" : "text-text-muted bg-surface-light"
              }`}>
                {s.trendUp ? <TrendingUp size={10} /> : null}
                {s.trend}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{s.label}</p>
            <p className="text-xl font-bold text-text-primary">{s.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5 truncate">{s.detail}</p>
            <div className="mt-2">
              <MiniSparkline data={s.sparkData} color={s.color} height={28} />
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. QUICK ACTION LAUNCHER
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="quick-actions">
        {quickActions.map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="group rounded-xl border border-border bg-white p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
              <a.icon size={18} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-text-primary">{a.label}</p>
            <p className="text-xs text-text-muted mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          5. PRIMARY DATA VISUALIZATIONS
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="primary-charts">
        {/* 5a. Query Activity — Combo Bar + Line chart (wider) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
          <SectionHeader icon={Activity} title="Query Activity" subtitle="Daily queries + cumulative trend over 7 days" iconColor="text-blue-500"
            action={<span className="text-[10px] text-text-muted bg-surface-light px-2 py-0.5 rounded-full">{queryHistory.length} total</span>} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activityChartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#3B82F6" }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<DashTooltip />} />
              <Bar yAxisId="left" dataKey="queries" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={36} name="Queries" />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#3B82F6" strokeWidth={2} dot={false} name="Cumulative" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5b. Dataset Distribution — Donut chart */}
        <div className="rounded-xl border border-border bg-white p-5">
          <SectionHeader icon={Database} title="Dataset Overview" subtitle={`${datasets.length} dataset${datasets.length !== 1 ? "s" : ""} loaded`} iconColor="text-purple-500" />
          {datasets.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={datasetDistribution} innerRadius={45} outerRadius={70} paddingAngle={3}
                    dataKey="value" nameKey="name" strokeWidth={0}>
                    {datasetDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString() + " rows"} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {datasets.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-text-secondary font-medium">{d.name}</span>
                    </div>
                    <span className="text-text-muted">{(d.row_count || 0).toLocaleString()} rows</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Database size={28} className="text-text-muted mb-2" />
              <p className="text-xs text-text-muted">No datasets loaded yet</p>
              <button onClick={() => navigate("/upload")} className="mt-2 text-xs text-primary hover:underline font-medium">Upload CSV →</button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          5c. ACTIVITY HEATMAP + DATA COVERAGE GAUGE
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap: Query Activity by Day × Hour */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
          <SectionHeader icon={BarChart3} title="Activity Heatmap" subtitle="Query volume by weekday and hour" iconColor="text-orange-500" />
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="flex items-center gap-0.5 mb-1 pl-10">
                {[0,3,6,9,12,15,18,21].map(h => (
                  <span key={h} className="text-[9px] text-text-muted" style={{ width: `${100/24*3}%`, textAlign: "left" }}>
                    {h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h-12}p`}
                  </span>
                ))}
              </div>
              {heatmapData.grid.map(row => (
                <div key={row.day} className="flex items-center gap-0.5 mb-0.5">
                  <span className="w-9 text-[10px] text-text-muted font-medium text-right pr-1 shrink-0">{row.day}</span>
                  <div className="flex gap-0.5 flex-1">
                    {row.hours.map(h => (
                      <div key={h.hour} className="flex-1">
                        <HeatmapCell value={h.count} max={heatmapData.maxCount} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end gap-2 mt-2 text-[9px] text-text-muted">
                <span>Less</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(249,115,22,${o})` }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Coverage Gauges */}
        <div className="rounded-xl border border-border bg-white p-5">
          <SectionHeader icon={Target} title="Data Coverage" subtitle="How complete is your data setup" iconColor="text-emerald-500" />
          <div className="flex items-center justify-around py-2">
            <GaugeRing value={datasets.length} max={5} label="Datasets" color="#F97316" />
            <GaugeRing value={totalColumns} max={50} label="Columns" color="#3B82F6" />
            <GaugeRing value={queryHistory.length} max={20} label="Queries" color="#22C55E" />
          </div>
          <p className="text-[10px] text-text-muted text-center mt-3">
            {datasets.length === 0 ? "Upload data to start building coverage" :
             totalColumns > 20 ? "Excellent data richness — ready for deep analysis!" :
             "Upload more datasets to unlock more insights"}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          6. DATA QUALITY + COLUMN TYPE BREAKDOWN
          ══════════════════════════════════════════════════════════ */}
      {datasets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column type breakdown */}
          <div className="rounded-xl border border-border bg-white p-5">
            <SectionHeader icon={Layers} title="Data Schema Analysis" subtitle="Column type distribution across all datasets" iconColor="text-indigo-500" />
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={columnDistribution} innerRadius={30} outerRadius={50} dataKey="value" nameKey="name" strokeWidth={0}>
                      {columnDistribution.map((c, i) => <Cell key={i} fill={c.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { label: "Numeric", count: columnTypeBreakdown.numeric, color: "#3B82F6", icon: Hash, desc: "INT, DOUBLE, FLOAT" },
                  { label: "Text", count: columnTypeBreakdown.text, color: "#F97316", icon: Type, desc: "TEXT, VARCHAR" },
                  { label: "Date", count: columnTypeBreakdown.date, color: "#22C55E", icon: Calendar, desc: "DATE, TIMESTAMP" },
                ].map(col => (
                  <div key={col.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: col.color + "15" }}>
                      <col.icon size={13} style={{ color: col.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-text-primary">{col.label}</span>
                        <span className="text-text-muted">{col.count} / {columnTypeBreakdown.total}</span>
                      </div>
                      <div className="w-full bg-surface-lighter rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          backgroundColor: col.color, width: `${columnTypeBreakdown.total ? (col.count / columnTypeBreakdown.total * 100) : 0}%`
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-dataset detail table */}
          <div className="rounded-xl border border-border bg-white p-5">
            <SectionHeader icon={Table2} title="Dataset Details" subtitle="Schema & row counts per dataset" iconColor="text-teal-500"
              action={<button onClick={() => navigate("/explorer")} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                Explore All <ExternalLink size={11} />
              </button>} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-text-muted font-semibold uppercase tracking-wider">Dataset</th>
                    <th className="text-right py-2 px-2 text-text-muted font-semibold uppercase tracking-wider">Rows</th>
                    <th className="text-right py-2 px-2 text-text-muted font-semibold uppercase tracking-wider">Columns</th>
                    <th className="text-right py-2 px-2 text-text-muted font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d, i) => (
                    <tr key={d.name} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="font-medium text-text-primary">{d.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-2.5 px-2 text-text-secondary">{(d.row_count || 0).toLocaleString()}</td>
                      <td className="text-right py-2.5 px-2 text-text-secondary">{d.columns?.length || 0}</td>
                      <td className="text-right py-2.5 px-2">
                        <button onClick={() => { setActiveDataset(d.name); navigate("/explorer"); }}
                          className="text-primary hover:underline font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          6b. AI-GENERATED INSIGHTS & ANNOTATIONS
          ══════════════════════════════════════════════════════════ */}
      {aiInsights.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-5" id="ai-insights">
          <SectionHeader icon={Lightbulb} title="AI-Generated Insights" subtitle="Smart observations from your data and usage patterns" iconColor="text-amber-500"
            action={<span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{aiInsights.length} insights</span>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-light/50 border border-border hover:border-amber-200 transition-colors">
                <span className="text-base mt-0.5 shrink-0">{insightIcons[ins.type] || "💡"}</span>
                <p className="text-xs text-text-secondary leading-relaxed">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          6c. COLLABORATION & SHARING TOOLBAR
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3 px-5" id="collab-toolbar">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Share2 size={14} className="text-text-muted" />
          <span className="font-medium">Share & Export</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleShare("link")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/30 hover:bg-primary-50 text-text-secondary hover:text-primary transition-all">
            <Link size={12} /> Copy Link
          </button>
          <button onClick={() => handleShare("export")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/30 hover:bg-primary-50 text-text-secondary hover:text-primary transition-all">
            <FileDown size={12} /> Export JSON
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/30 hover:bg-primary-50 text-text-secondary hover:text-primary transition-all">
            <Image size={12} /> Print / PDF
          </button>
        </div>
        {shareToast && (
          <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 font-medium animate-fade-in flex items-center gap-1">
            <CheckCircle2 size={12} /> {shareToast}
          </span>
        )}
      </div>





      {/* ══════════════════════════════════════════════════════════
          9. LAST QUERY RESULT PREVIEW
          ══════════════════════════════════════════════════════════ */}
      {dashboardData && !dashboardData.error && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-orange-50/50 to-amber-50/50 p-5" id="last-query-preview">
          <SectionHeader icon={Zap} title="Last Query Result" subtitle="Your most recent AI query result" iconColor="text-orange-500"
            action={<button onClick={() => navigate("/query")} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              View Full Results <ArrowRight size={11} />
            </button>} />
          <div className="flex flex-wrap items-center gap-4">
            {queryHistory.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border text-xs text-text-secondary">
                <MessageSquareText size={13} className="text-primary" />
                <span className="font-medium truncate max-w-xs">"{queryHistory[0]?.prompt}"</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-text-muted">
              {dashboardData.charts?.length > 0 && (
                <span className="flex items-center gap-1"><BarChart3 size={12} /> {dashboardData.charts.length} chart(s)</span>
              )}
              {dashboardData.kpis?.length > 0 && (
                <span className="flex items-center gap-1"><Target size={12} /> {dashboardData.kpis.length} KPI(s)</span>
              )}
              {dashboardData.metadata?.query_time_ms && (
                <span className="flex items-center gap-1"><Clock size={12} /> {dashboardData.metadata.query_time_ms}ms</span>
              )}
              {dashboardData.metadata?.rows_returned && (
                <span className="flex items-center gap-1"><Layers size={12} /> {dashboardData.metadata.rows_returned} rows</span>
              )}
            </div>
          </div>
          {/* Mini KPI preview */}
          {dashboardData.kpis?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {dashboardData.kpis.slice(0, 4).map((kpi, i) => (
                <div key={i} className="bg-white rounded-lg border border-border px-3 py-2 text-xs">
                  <p className="text-text-muted">{kpi.label}</p>
                  <p className="text-sm font-bold text-text-primary">{kpi.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* ══════════════════════════════════════════════════════════
          11. PINNED DASHBOARDS
          ══════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-white p-5">
        <SectionHeader icon={Pin} title="Pinned Dashboards" subtitle={`${filteredPins.length} saved view${filteredPins.length !== 1 ? "s" : ""}`} iconColor="text-pink-500" />
        {filteredPins.length > 0 ? (
          <div className="space-y-2.5">
            {filteredPins.slice(0, showAllPins ? 20 : 4).map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all group">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                  <Bookmark size={14} className="text-pink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{p.title || p.query_prompt}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                    {p.charts?.length > 0 && <span>{p.charts.length} chart(s)</span>}
                    {p.dataset && <span className="px-1.5 py-0.5 bg-surface-light rounded border border-border">{p.dataset}</span>}
                    {p.created_at && <span>{new Date(p.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); navigate("/query", { state: { prefill: p.query_prompt } }); }}
                    className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-primary transition-colors" title="Re-run">
                    <PlayCircle size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removePin(p.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors" title="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {filteredPins.length > 4 && (
              <button onClick={() => setShowAllPins(!showAllPins)}
                className="w-full text-center text-xs text-primary hover:underline font-medium py-2">
                {showAllPins ? "Show less" : `Show ${filteredPins.length - 4} more`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Pin size={24} className="mx-auto mb-2 text-text-muted" />
            <p className="text-xs text-text-muted">No pinned dashboards</p>
            <p className="text-[10px] text-text-muted mt-1">Pin results from AI Query to save them here</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          12. EMPTY STATE ONBOARDING (when no datasets)
          ══════════════════════════════════════════════════════════ */}
      {datasets.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-8 text-center" id="onboarding">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LayoutDashboard size={28} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Welcome to BI Agent!</h2>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
            Get started by uploading a dataset. Then ask questions in natural language and get instant charts, insights, and KPIs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border shadow-sm">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"><span className="text-sm font-bold text-orange-600">1</span></div>
              <div className="text-left"><p className="text-xs font-semibold text-text-primary">Upload CSV</p><p className="text-[10px] text-text-muted">Import your data</p></div>
            </div>
            <ChevronRight size={16} className="text-text-muted hidden sm:block" />
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-sm font-bold text-blue-600">2</span></div>
              <div className="text-left"><p className="text-xs font-semibold text-text-primary">Explore Schema</p><p className="text-[10px] text-text-muted">Understand your data</p></div>
            </div>
            <ChevronRight size={16} className="text-text-muted hidden sm:block" />
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border shadow-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><span className="text-sm font-bold text-green-600">3</span></div>
              <div className="text-left"><p className="text-xs font-semibold text-text-primary">Ask AI</p><p className="text-[10px] text-text-muted">Get instant insights</p></div>
            </div>
          </div>
          <button onClick={() => navigate("/upload")}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all">
            <Upload size={14} className="inline mr-2" /> Upload Your First Dataset
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          13. FOOTER STATUS BAR
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-text-muted px-2 pt-3 border-t border-border" id="footer-status">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? "bg-green-500" : "bg-red-500"}`} />
            {backendConnected ? "System Online" : "System Offline"}
          </span>
          <span>{datasets.length} dataset{datasets.length !== 1 ? "s" : ""} loaded</span>
          <span>{queryHistory.length} queries this session</span>
          <span>{pinnedDashboards.length} pinned</span>
          <span>{schedules.filter(s => s.active).length} reports active</span>
        </div>
        <span className="font-medium">BI Agent • AI-Powered Analytics</span>
      </div>
    </div>
  );
}
