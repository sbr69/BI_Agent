import { useAppContext } from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ChartRenderer from "../components/ChartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import KPICards from "../components/KPICards";
import {
  Clock,
  BarChart3,
  MessageSquareText,
  RotateCcw,
  History as HistoryIcon,
  X,
  Trash2,
  Table2,
} from "lucide-react";

export default function HistoryPage() {
  const { queryHistory, setQueryHistory } = useAppContext();
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [viewMode, setViewMode] = useState("charts");

  const handleDelete = (index) => {
    setQueryHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRerun = (entry) => {
    navigate("/query", { state: { prefill: entry.prompt } });
  };

  const handleViewResult = (entry) => {
    setSelectedEntry(entry);
    setViewMode("charts");
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group history by date
  const grouped = queryHistory.reduce((acc, entry, originalIndex) => {
    const dateKey = formatDate(entry.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push({ ...entry, originalIndex });
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Query History
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Review and re-run your previous queries
          </p>
        </div>
        {queryHistory.length > 0 && (
          <span className="text-xs text-text-muted bg-surface-light px-2.5 py-1 rounded-full">
            {queryHistory.length} queries
          </span>
        )}
      </div>

      {/* Empty State */}
      {queryHistory.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mx-auto mb-4">
            <HistoryIcon size={28} className="text-text-muted" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-1">
            No queries yet
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Your query history will appear here after you run your first query.
          </p>
          <button
            onClick={() => navigate("/query")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquareText size={14} />
            Start Querying
          </button>
        </div>
      )}

      {/* Grouped History */}
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            {date}
          </h3>
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="card p-4 card-hover transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquareText
                      size={14}
                      className="text-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {entry.prompt}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatTime(entry.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 size={11} />{" "}
                        {entry.result?.charts?.length || 0} charts
                      </span>
                      {entry.dataset && (
                        <span className="px-1.5 py-0.5 bg-surface-light rounded text-[10px]">
                          {entry.dataset}
                        </span>
                      )}
                      {entry.result?.metadata?.query_time_ms && (
                        <span>
                          {entry.result.metadata.query_time_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleViewResult(entry)}
                      className="p-1.5 rounded-md hover:bg-surface-light text-text-muted hover:text-primary transition-colors"
                      title="View result"
                    >
                      <BarChart3 size={14} />
                    </button>
                    <button
                      onClick={() => handleRerun(entry)}
                      className="p-1.5 rounded-md hover:bg-surface-light text-text-muted hover:text-primary transition-colors"
                      title="Re-run query"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.originalIndex)}
                      className="p-1.5 rounded-md hover:bg-error-50 text-text-muted hover:text-error transition-colors"
                      title="Delete from history"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Popup Modal for Viewing Results */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 mt-14 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEntry(null)}>
          <div 
            className="bg-surface rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-surface shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-lg font-semibold text-text-primary truncate">
                  {selectedEntry.prompt}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  {formatDate(selectedEntry.timestamp)} at {formatTime(selectedEntry.timestamp)}
                  {selectedEntry.dataset && ` • Dataset: ${selectedEntry.dataset}`}
                </p>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-lg hover:bg-surface-light text-text-muted transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-surface-light">
              {/* KPIs (if any) */}
              {selectedEntry.result?.kpis?.length > 0 && (
                <KPICards kpis={selectedEntry.result.kpis} />
              )}

              {/* Insights (if any) */}
              {selectedEntry.result?.insights?.length > 0 && (
                <InsightCard insights={selectedEntry.result.insights} />
              )}

              {/* Charts area */}
              {selectedEntry.result?.charts?.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    {/* View toggle */}
                    <div className="flex rounded-lg border border-border overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => setViewMode("charts")}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                          viewMode === "charts"
                            ? "bg-primary text-white"
                            : "bg-white text-text-secondary hover:bg-surface-light"
                        }`}
                      >
                        <BarChart3 size={14} /> Charts
                      </button>
                      <button
                        onClick={() => setViewMode("table")}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                          viewMode === "table"
                            ? "bg-primary text-white"
                            : "bg-white text-text-secondary hover:bg-surface-light"
                        }`}
                      >
                        <Table2 size={14} /> Data Grid
                      </button>
                    </div>
                  </div>

                  {viewMode === "charts" ? (
                    <div className={`grid gap-4 ${selectedEntry.result.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                      {selectedEntry.result.charts.map((chart, i) => (
                        <ChartRenderer key={i} chart={chart} index={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedEntry.result.charts.map((chart, i) => (
                        <div key={i} className="card p-5 bg-white">
                          <h3 className="text-sm font-semibold text-text-primary mb-3">
                            {chart.title} Data
                          </h3>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <DataTable data={chart.data} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-text-muted bg-surface rounded-xl border border-border">
                  <BarChart3 size={24} className="mx-auto mb-2 opacity-50" />
                  No visualizations available for this query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
