import { useAppContext } from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  BarChart3,
  MessageSquareText,
  Trash2,
  RotateCcw,
  History as HistoryIcon,
} from "lucide-react";

export default function HistoryPage() {
  const { queryHistory, setChatHistory, setDashboardData } = useAppContext();
  const navigate = useNavigate();

  const handleRerun = (entry) => {
    navigate("/query", { state: { prefill: entry.prompt } });
  };

  const handleViewResult = (entry) => {
    setDashboardData(entry.result);
    navigate("/query");
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
  const grouped = queryHistory.reduce((acc, entry) => {
    const dateKey = formatDate(entry.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
