import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KPICards({ kpis }) {
  if (!kpis?.length) return null;

  const trendIcon = (trend) => {
    if (trend === "up") return <TrendingUp size={16} className="text-green-500" />;
    if (trend === "down") return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={14} className="text-text-muted" />;
  };

  const trendColor = (trend) => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-text-muted";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="card p-5 flex flex-col justify-between card-hover transition-all"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">
            {kpi.label}
          </p>
          <p className="text-2xl font-bold text-text-primary mb-1">
            {kpi.value}
          </p>
          {kpi.change && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor(kpi.trend)}`}>
              {trendIcon(kpi.trend)}
              <span>{kpi.change}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
