import { useAppContext } from "./Layout";
import {
  Database,
  Wifi,
  WifiOff,
  ChevronDown,
  Calendar,
  X,
  Menu,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function TopBar({ onMenuToggle }) {
  const {
    datasets, activeDataset, setActiveDataset, backendConnected,
    dateFrom, setDateFrom, dateTo, setDateTo,
  } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasDateFilter = dateFrom || dateTo;

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-30 gap-2">
      {/* Left: Hamburger (mobile) + Dataset selector */}
      <div className="flex items-center gap-2 min-w-0" ref={ref}>
        {/* Mobile hamburger */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-text-muted hover:bg-surface-light hover:text-text-secondary transition-colors shrink-0"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary-200 hover:bg-surface-hover transition-colors text-sm"
          >
            <Database size={14} className="text-primary" />
            <span className="text-text-secondary font-medium truncate max-w-[120px] md:max-w-none">
              {activeDataset || "No dataset"}
            </span>
            <ChevronDown size={14} className="text-text-muted shrink-0" />
          </button>
          {dropdownOpen && datasets.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
              {datasets.map((ds) => (
                <button
                  key={ds.name}
                  onClick={() => {
                    setActiveDataset(ds.name);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center justify-between ${
                    ds.name === activeDataset
                      ? "text-primary font-medium bg-primary-50"
                      : "text-text-secondary"
                  }`}
                >
                  <span>{ds.name}</span>
                  <span className="text-xs text-text-muted">
                    {ds.row_count?.toLocaleString()} rows
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Date range filter — hidden on small screens */}
      <div className="hidden sm:flex items-center gap-2">
        <Calendar size={14} className="text-text-muted" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-2 py-1 text-xs border border-border rounded-md bg-white text-text-secondary focus:border-primary/40 outline-none"
          placeholder="From"
        />
        <span className="text-xs text-text-muted">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-2 py-1 text-xs border border-border rounded-md bg-white text-text-secondary focus:border-primary/40 outline-none"
          placeholder="To"
        />
        {hasDateFilter && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="flex items-center gap-1 px-1.5 py-1 rounded text-xs text-error hover:bg-error-50 transition-colors"
            title="Clear date filter"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Right: Connection status */}
      <div className="flex items-center gap-4 shrink-0">
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            backendConnected
              ? "bg-success-50 text-success"
              : "bg-error-50 text-error"
          }`}
        >
          {backendConnected ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          <span className="hidden sm:inline">
            {backendConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  );
}
