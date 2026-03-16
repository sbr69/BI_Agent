import ChartRenderer from "./ChartRenderer";
import InsightCard from "./InsightCard";
import { Clock, Database, Layers } from "lucide-react";

export default function Dashboard({ data }) {
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
                {error}
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
    <div className="w-full max-w-7xl mx-auto animate-fade-in" id="dashboard">
      {/* Metadata Bar */}
      {metadata && (
        <div className="flex flex-wrap items-center gap-4 mb-6 px-1 text-xs text-text-muted animate-fade-in-up">
          {metadata.query_time_ms && (
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> {metadata.query_time_ms}ms
            </span>
          )}
          {metadata.rows_returned !== undefined && (
            <span className="flex items-center gap-1.5">
              <Database size={13} /> {metadata.rows_returned.toLocaleString()} rows
            </span>
          )}
          {metadata.queries_executed && (
            <span className="flex items-center gap-1.5">
              <Layers size={13} /> {metadata.queries_executed} queries
            </span>
          )}
          {metadata.dataset && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {metadata.dataset}
            </span>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className={`grid gap-5 mb-6 ${
        charts.length === 1
          ? "grid-cols-1 max-w-4xl mx-auto"
          : "grid-cols-1 lg:grid-cols-2"
      }`}>
        {charts.map((chart, i) => (
          <ChartRenderer key={i} chart={chart} index={i} />
        ))}
      </div>

      {/* Insights */}
      {insights?.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <InsightCard insights={insights} />
        </div>
      )}
    </div>
  );
}
