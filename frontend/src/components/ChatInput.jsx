import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Show me total revenue by customer region",
  "Monthly sales trends for 2023 by product category",
  "What's the most popular payment method?",
  "Top 5 product categories by average discount",
  "Revenue vs discount correlation analysis",
  "Compare Q1 and Q2 2023 performance by region",
];

export default function ChatInput({ onSubmit, isLoading, disabled }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
    setQuery("");
  };

  const handleExampleClick = (prompt) => {
    if (isLoading) return;
    setQuery(prompt);
    onSubmit(prompt);
  };

  return (
    <div className="w-full animate-fade-in-up">
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass rounded-2xl p-1.5 transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-[0_0_30px_rgba(102,126,234,0.15)]">
          <div className="flex items-center gap-3">
            <div className="pl-4 text-primary">
              <Sparkles size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your data..."
              disabled={isLoading || disabled}
              className="flex-1 bg-transparent py-4 px-2 text-text-primary placeholder-text-muted outline-none text-base disabled:opacity-50"
              id="query-input"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading || disabled}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-white transition-all duration-200 hover:bg-primary-light hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 mr-1"
              id="submit-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>

      {/* Example Prompts */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleExampleClick(prompt)}
            disabled={isLoading || disabled}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-surface-light text-text-secondary border border-border transition-all duration-200 hover:border-primary/40 hover:text-primary hover:bg-surface-lighter disabled:opacity-30 disabled:hover:border-border"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
