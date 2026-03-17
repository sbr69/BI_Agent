import { useAppContext } from "./Layout";
import {
  Database,
  Wifi,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function TopBar() {
  const { datasets, activeDataset, setActiveDataset, backendConnected } =
    useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 z-30">
      {/* Left: Dataset selector */}
      <div className="flex items-center gap-3" ref={ref}>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary-200 hover:bg-surface-hover transition-colors text-sm"
          >
            <Database size={14} className="text-primary" />
            <span className="text-text-secondary font-medium">
              {activeDataset || "No dataset"}
            </span>
            <ChevronDown size={14} className="text-text-muted" />
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

      {/* Right: Connection status */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            backendConnected
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {backendConnected ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          {backendConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </header>
  );
}
