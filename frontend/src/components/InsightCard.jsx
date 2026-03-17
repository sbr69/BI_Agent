import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

export default function InsightCard({ insights }) {
  if (!insights?.length) return null;

  const getIcon = (insight) => {
    const lower = insight.toLowerCase();
    if (lower.includes("highest") || lower.includes("top") || lower.includes("best") || lower.includes("increase"))
      return <TrendingUp size={16} className="text-success" />;
    if (lower.includes("warning") || lower.includes("error") || lower.includes("lowest") || lower.includes("decline"))
      return <AlertTriangle size={16} className="text-warning" />;
    return <Lightbulb size={16} className="text-primary" />;
  };

  return (
    <div className="card p-5 animate-fade-in-up" id="insights-card">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
        <Lightbulb size={16} className="text-primary" />
        AI Insights
      </h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-surface-light border border-border transition-all duration-200 hover:border-primary-200"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="mt-0.5 shrink-0">{getIcon(insight)}</div>
            <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
