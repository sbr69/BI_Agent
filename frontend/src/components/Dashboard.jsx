import { useState } from "react";
import ChartRenderer from "./ChartRenderer";
import InsightCard from "./InsightCard";
import DataTable from "./DataTable";
import { Clock, Database, Layers, Table, BarChart3 } from "lucide-react";

function sanitizeText(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function Dashboard({ data }) {
  const [viewMode, setViewMode] = useState("charts"); // "charts" | "table"

  if (!data) return null;

  const { charts, insights, metadata, error } = data;

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
        <div className="glass rounded-2xl p-6 border-error/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
              <span className="text-error text-lg">!</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-error mb-1">
                Could not generate dashboard
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {sanitizeText(error)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!charts?.length) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
        <div className="glass rounded-2xl p-6">
          <p className="text-text-muted text-center">No charts generated. Try a different query.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[90rem] mx-auto animate-fade-in" id="dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
        {metadata && (
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500 font-medium">
            {metadata.query_time_ms != null && (
              <span className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md">
                <Clock size={14} className="text-slate-400" /> {metadata.query_time_ms}ms
              </span>
            )}
            {metadata.rows_returned !== undefined && (
              <span className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md">
                <Database size={14} className="text-slate-400" /> {metadata.rows_returned.toLocaleString()} rows
              </span>
            )}
            {metadata.queries_executed != null && (
              <span className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md">
                <Layers size={14} className="text-slate-400" /> {metadata.queries_executed} queries
              </span>
            )}
            {metadata.dataset && (
              <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                {sanitizeText(metadata.dataset)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200">
          <button
            onClick={() => setViewMode("charts")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
              viewMode === "charts"
                ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart3 size={15} /> Charts
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
              viewMode === "table"
                ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Table size={15} /> Data
          </button>
        </div>
      </div>

      {viewMode === "charts" ? (
        <div className={`grid gap-6 mb-8 ${
          charts.length === 1
            ? "grid-cols-1 max-w-5xl mx-auto"
            : "grid-cols-1 xl:grid-cols-2"
        }`}>
          {charts.map((chart, i) => (
            <ChartRenderer key={i} chart={chart} index={i} />
          ))}
        </div>
      ) : (
        /* Data Table View — per chart */
        <div className="space-y-6 mb-6">
          {charts.map((chart, i) => (
            <DataTable
              key={i}
              data={chart.data}
              title={chart.title}
            />
          ))}
        </div>
      )}

      {/* Insights */}
      {insights?.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <InsightCard insights={insights} />
        </div>
      )}
    </div>
  );
}
