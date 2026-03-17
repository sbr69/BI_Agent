import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../components/layout/Layout";
import { sendQuery } from "../utils/api";
import ChartRenderer from "../components/ChartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import KPICards from "../components/KPICards";
import LoadingState from "../components/LoadingState";
import {
  Send,
  Lightbulb,
  Clock,
  BarChart3,
  Table2,
  User,
  Bot,
  RotateCcw,
  Pin,
  History,
} from "lucide-react";
import { EXAMPLE_PROMPTS } from "../utils/constants";

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
    addPin,
    dateFrom,
    dateTo,
  } = useAppContext();

  const location = useLocation();
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState("charts");
  const [pinning, setPinning] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

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
      const result = await sendQuery(q, sessionId, activeDataset, dateFrom || null, dateTo || null);
      setDashboardData(result);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: result, timestamp: new Date() },
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
      setDashboardData({ error: err.message, charts: [], insights: [], kpis: [] });
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: { error: err.message }, timestamp: new Date() },
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

  const handlePin = () => {
    if (!dashboardData || dashboardData.error) return;
    setPinning(true);
    const lastUserMsg = [...chatHistory].reverse().find((m) => m.role === "user");
    const pin = {
      id: `pin_${Date.now()}`,
      title: lastUserMsg?.content || "Pinned Dashboard",
      query_prompt: lastUserMsg?.content || "",
      charts: dashboardData.charts || [],
      kpis: dashboardData.kpis || [],
      insights: dashboardData.insights || [],
      dataset: activeDataset,
      created_at: new Date().toISOString(),
    };
    addPin(pin);
    setTimeout(() => setPinning(false), 1000);
  };

  // Find the previous query for follow-up context display
  const previousQueries = chatHistory.filter((m) => m.role === "user");
  const hasPreviousContext = previousQueries.length > 1;
  const previousQuery = hasPreviousContext ? previousQueries[previousQueries.length - 2]?.content : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Query</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Ask questions about your data in natural language
        </p>
      </div>

      {/* Follow-up Context Banner */}
      {hasPreviousContext && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-info-50 border border-info/20 text-xs text-info">
          <History size={14} />
          <span>
            Follow-up mode &mdash; building on: <strong className="font-semibold">"{previousQuery}"</strong>
          </span>
          <button
            onClick={() => { setChatHistory([]); setDashboardData(null); }}
            className="ml-auto px-2 py-0.5 rounded bg-info/10 hover:bg-info/20 text-info transition-colors"
          >
            New session
          </button>
        </div>
      )}

      {/* Date Filter Active Banner */}
      {(dateFrom || dateTo) && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning-50 border border-warning/20 text-xs text-warning">
          <Clock size={14} />
          <span>
            Date filter active: {dateFrom || "..."} to {dateTo || "..."}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasPreviousContext
                ? "Ask a follow-up question..."
                : `Ask about "${activeDataset || "your data"}"...`}
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
                  msg.role === "user" ? "bg-primary-50" : "bg-info-50"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={14} className="text-primary" />
                ) : (
                  <Bot size={14} className="text-info" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {msg.role === "user" ? (
                  <p className="text-sm text-text-primary font-medium">{msg.content}</p>
                ) : (
                  <div className="text-sm text-text-secondary">
                    {msg.content?.error ? (
                      <span className="text-error">{msg.content.error}</span>
                    ) : (
                      <span>
                        Generated {msg.content?.charts?.length || 0} chart(s)
                        {msg.content?.kpis?.length > 0 && `, ${msg.content.kpis.length} KPI(s)`}
                        {msg.content?.metadata?.query_time_ms && (
                          <span className="text-text-muted"> in {msg.content.metadata.query_time_ms}ms</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-text-muted shrink-0 mt-1">
                {msg.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
          {/* KPI Cards */}
          {dashboardData.kpis?.length > 0 && !dashboardData.error && (
            <KPICards kpis={dashboardData.kpis} />
          )}

          {/* View Toggle + Metadata + Pin */}
          {!dashboardData.error && dashboardData.charts?.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-text-muted">
                {dashboardData.metadata?.query_time_ms && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {dashboardData.metadata.query_time_ms}ms
                  </span>
                )}
                <span>{dashboardData.metadata?.rows_returned} rows</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Pin button */}
                <button
                  onClick={handlePin}
                  disabled={pinning}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    pinning
                      ? "bg-success-50 border-success/30 text-success"
                      : "border-border text-text-secondary hover:border-primary-200 hover:text-primary"
                  }`}
                >
                  <Pin size={12} />
                  {pinning ? "Pinned!" : "Pin to Dashboard"}
                </button>
                {/* View toggle */}
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
            </div>
          )}

          {/* Charts */}
          {viewMode === "charts" && dashboardData.charts?.length > 0 && !dashboardData.error && (
            <div className={`grid gap-4 ${dashboardData.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
              {dashboardData.charts.map((chart, i) => (
                <ChartRenderer key={i} chart={chart} index={i} />
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && dashboardData.charts?.length > 0 && !dashboardData.error && (
            <div className="space-y-4">
              {dashboardData.charts.map((chart, i) => (
                <div key={i} className="card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">{chart.title}</h3>
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
