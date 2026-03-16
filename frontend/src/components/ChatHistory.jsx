import { User, Bot, BarChart3 } from "lucide-react";

export default function ChatHistory({ history }) {
  if (!history?.length) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 mb-6" id="chat-history">
      {history.map((entry, i) => (
        <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
          {/* User Message */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <User size={14} className="text-primary" />
            </div>
            <div className="glass rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
              <p className="text-sm text-text-primary">{entry.prompt}</p>
            </div>
          </div>

          {/* AI Response Summary */}
          <div className="flex items-start gap-3 ml-11 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-accent" />
            </div>
            <div className="glass rounded-xl rounded-tl-sm px-4 py-2.5">
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <BarChart3 size={14} className="text-accent" />
                Generated {entry.chartsCount} chart{entry.chartsCount !== 1 ? "s" : ""}
                {entry.queryTime && (
                  <span className="text-text-muted">• {entry.queryTime}ms</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
