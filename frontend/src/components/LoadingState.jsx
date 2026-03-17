import { Loader2, BarChart3, Brain } from "lucide-react";

const LOADING_MESSAGES = [
  "Analyzing your question...",
  "Generating SQL queries...",
  "Fetching data from the database...",
  "Selecting optimal chart types...",
  "Building your dashboard...",
];

export default function LoadingState() {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      {/* Main Loading Card */}
      <div className="card p-8 text-center">
        {/* Animated Icon */}
        <div className="relative mx-auto w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={28} className="text-primary animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Generating Dashboard
        </h3>
        <p className="text-sm text-text-muted mb-6">
          Our AI is crafting the perfect visualization for your query
        </p>

        {/* Progress Steps */}
        <div className="space-y-3 max-w-sm mx-auto text-left">
          {LOADING_MESSAGES.map((msg, i) => (
            <div
              key={i}
              className="flex items-center gap-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.6}s` }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/10">
                <Loader2 size={12} className="text-primary animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
              </div>
              <span className="text-sm text-text-secondary">{msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-4 w-48 rounded animate-shimmer mb-4" />
            <div className="h-[250px] rounded-lg animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
