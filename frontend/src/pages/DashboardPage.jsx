import { useAppContext } from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Database,
  Clock,
  MessageSquareText,
  ArrowRight,
  Lightbulb,
  Zap,
  Pin,
  Trash2,
} from "lucide-react";
import ChartRenderer from "../components/ChartRenderer";
import InsightCard from "../components/InsightCard";
import KPICards from "../components/KPICards";

export default function DashboardPage() {
  const {
    dashboardData, datasets, activeDataset, queryHistory, isLoading,
    pinnedDashboards, removePin,
  } = useAppContext();
  const navigate = useNavigate();

  const currentDataset = datasets.find((d) => d.name === activeDataset);
  const latestCharts = dashboardData?.charts || [];
  const latestInsights = dashboardData?.insights || [];
  const latestKpis = dashboardData?.kpis || [];
  const meta = dashboardData?.metadata || {};

  const stats = [
    {
      label: "Active Dataset",
      value: activeDataset || "None",
      icon: Database,
      color: "text-primary",
      bg: "bg-primary-50",
    },
    {
      label: "Total Rows",
      value: currentDataset ? currentDataset.row_count?.toLocaleString() : "--",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Columns",
      value: currentDataset ? currentDataset.columns?.length : "--",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Queries Run",
      value: queryHistory.length,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Overview of your analytics workspace
          </p>
        </div>
        <button
          onClick={() => navigate("/query")}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
        >
          <MessageSquareText size={16} />
          New Query
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="card p-4 flex items-center gap-4 card-hover transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-bold text-text-primary mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pinned Dashboards */}
      {pinnedDashboards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Pin size={14} className="text-primary" />
            Pinned Dashboards
          </h2>
          <div className="space-y-4">
            {pinnedDashboards.map((pin) => (
              <div key={pin.id} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-light">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{pin.title}</h3>
                    <p className="text-[11px] text-text-muted">
                      {pin.dataset && `${pin.dataset} · `}
                      Pinned {new Date(pin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removePin(pin.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Unpin"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {pin.kpis?.length > 0 && <KPICards kpis={pin.kpis} />}
                  {pin.charts?.length > 0 && (
                    <div className={`grid gap-4 ${pin.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                      {pin.charts.map((chart, i) => (
                        <div key={i}>
                          <h4 className="text-xs font-medium text-text-secondary mb-2">{chart.title}</h4>
                          <ChartRenderer chart={chart} index={i} />
                        </div>
                      ))}
                    </div>
                  )}
                  {pin.insights?.length > 0 && (
                    <div className="text-xs text-text-muted space-y-1">
                      {pin.insights.map((ins, i) => (
                        <p key={i} className="flex items-start gap-1.5">
                          <Lightbulb size={11} className="text-primary shrink-0 mt-0.5" />
                          {ins}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!dashboardData && pinnedDashboards.length === 0 && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Get Started with AI Analytics
          </h2>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Ask questions about your data in plain English and get instant
            visualizations, insights, and answers.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Show me total revenue by region",
              "Monthly sales trends",
              "Top 5 product categories",
            ].map((q) => (
              <button
                key={q}
                onClick={() => navigate("/query", { state: { prefill: q } })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary-200 hover:bg-primary-50 text-xs text-text-secondary hover:text-primary transition-all"
              >
                <Lightbulb size={12} />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Latest Results */}
      {dashboardData && !dashboardData.error && (
        <>
          {latestKpis.length > 0 && <KPICards kpis={latestKpis} />}

          {meta.query_time_ms && (
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {meta.query_time_ms}ms
              </span>
              <span>{meta.rows_returned} rows returned</span>
              <span>{meta.queries_executed} queries executed</span>
              <button
                onClick={() => navigate("/query")}
                className="ml-auto flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Open AI Query <ArrowRight size={12} />
              </button>
            </div>
          )}

          {latestCharts.length > 0 && (
            <div className={`grid gap-4 ${latestCharts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
              {latestCharts.map((chart, i) => (
                <div key={i} className="card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{chart.title}</h3>
                  {chart.description && (
                    <p className="text-xs text-text-muted mb-3">{chart.description}</p>
                  )}
                  <ChartRenderer chart={chart} index={i} />
                </div>
              ))}
            </div>
          )}

          {latestInsights.length > 0 && <InsightCard insights={latestInsights} />}
        </>
      )}

      {/* Error State */}
      {dashboardData?.error && (
        <div className="card p-6 border-error/20">
          <p className="text-sm text-error">{dashboardData.error}</p>
        </div>
      )}
    </div>
  );
}
