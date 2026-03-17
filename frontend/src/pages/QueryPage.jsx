import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../components/layout/Layout";
import { sendQuery } from "../utils/api";
import ChartRenderer from "../components/ChartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import LoadingState from "../components/LoadingState";
import {
  Send,
  Lightbulb,
  Clock,
  BarChart3,
  Table2,
  MessageSquareText,
  User,
  Bot,
  RotateCcw,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Show me total revenue by customer region",
  "Monthly sales trends for 2023 by product category",
  "What's the most popular payment method?",
  "Top 5 product categories by average discount",
  "Revenue vs discount correlation analysis",
  "Compare Q1 and Q2 2023 performance by region",
];

export default function QueryPage() {
  const {
    dashboardData,
    setDashboardData,
    chatHistory,
    setChatHistory,
    isLoading,
    setIsLoading,
    activeDataset,
    sessionId,
    addToHistory,
  } = useAppContext();

  const location = useLocation();
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState("charts");
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Handle prefill from dashboard page
  useEffect(() => {
    if (location.state?.prefill) {
      setInput(location.state.prefill);
      inputRef.current?.focus();
    }
  }, [location.state]);

  const handleSubmit = async (prompt) => {
    const q = prompt || input.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setInput("");

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: q, timestamp: new Date() },
    ]);

    try {
      const result = await sendQuery(q, sessionId, activeDataset);
      setDashboardData(result);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result,
          timestamp: new Date(),
        },
      ]);
      addToHistory({
        prompt: q,
        result,
        timestamp: new Date(),
        dataset: activeDataset,
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setDashboardData({ error: err.message, charts: [], insights: [] });
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: { error: err.message },
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Query</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Ask questions about your data in natural language
        </p>
      </div>

      {/* Input Area */}
      <div className="card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about "${activeDataset || "your data"}"...`}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface-light text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
            />
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="self-end px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-surface-lighter disabled:text-text-muted text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            Ask
          </button>
        </div>

        {/* Example Prompts */}
        {chatHistory.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSubmit(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary-200 hover:bg-primary-50 text-xs text-text-secondary hover:text-primary transition-all"
              >
                <Lightbulb size={11} />
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="space-y-3">
          {chatHistory.map((msg, i) => (
            <div key={i} className="flex gap-3 animate-fade-in-up">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-primary-50"
                    : "bg-blue-50"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={14} className="text-primary" />
                ) : (
                  <Bot size={14} className="text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {msg.role === "user" ? (
                  <p className="text-sm text-text-primary font-medium">
                    {msg.content}
                  </p>
                ) : (
                  <div className="text-sm text-text-secondary">
                    {msg.content?.error ? (
                      <span className="text-error">{msg.content.error}</span>
                    ) : (
                      <span>
                        Generated {msg.content?.charts?.length || 0} chart(s)
                        {msg.content?.metadata?.query_time_ms && (
                          <span className="text-text-muted">
                            {" "}
                            in {msg.content.metadata.query_time_ms}ms
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-text-muted shrink-0 mt-1">
                {msg.timestamp?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingState />}

      {/* Results */}
      {dashboardData && !isLoading && (
        <div ref={resultsRef} className="space-y-4">
          {/* View Toggle + Metadata */}
          {!dashboardData.error && dashboardData.charts?.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-text-muted">
                {dashboardData.metadata?.query_time_ms && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />{" "}
                    {dashboardData.metadata.query_time_ms}ms
                  </span>
                )}
                <span>
                  {dashboardData.metadata?.rows_returned} rows
                </span>
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("charts")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === "charts"
                      ? "bg-primary text-white"
                      : "bg-white text-text-secondary hover:bg-surface-light"
                  }`}
                >
                  <BarChart3 size={12} /> Charts
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === "table"
                      ? "bg-primary text-white"
                      : "bg-white text-text-secondary hover:bg-surface-light"
                  }`}
                >
                  <Table2 size={12} /> Table
                </button>
              </div>
            </div>
          )}

          {/* Charts */}
          {viewMode === "charts" &&
            dashboardData.charts?.length > 0 &&
            !dashboardData.error && (
              <div
                className={`grid gap-4 ${
                  dashboardData.charts.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-1 lg:grid-cols-2"
                }`}
              >
                {dashboardData.charts.map((chart, i) => (
                  <div key={i} className="card p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {chart.title}
                    </h3>
                    {chart.description && (
                      <p className="text-xs text-text-muted mb-3">
                        {chart.description}
                      </p>
                    )}
                    <ChartRenderer chart={chart} />
                  </div>
                ))}
              </div>
            )}

          {/* Table View */}
          {viewMode === "table" &&
            dashboardData.charts?.length > 0 &&
            !dashboardData.error && (
              <div className="space-y-4">
                {dashboardData.charts.map((chart, i) => (
                  <div key={i} className="card p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                      {chart.title}
                    </h3>
                    <DataTable data={chart.data} title={chart.title} />
                  </div>
                ))}
              </div>
            )}

          {/* Insights */}
          {dashboardData.insights?.length > 0 && !dashboardData.error && (
            <InsightCard insights={dashboardData.insights} />
          )}

          {/* Error */}
          {dashboardData.error && (
            <div className="card p-6 border-error/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-error">{dashboardData.error}</p>
                <button
                  onClick={() => setDashboardData(null)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                >
                  <RotateCcw size={12} /> Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
