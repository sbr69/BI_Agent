import { useState, useEffect } from "react";
import { useAppContext } from "../components/layout/Layout";
import { checkHealth } from "../utils/api";
import {
  Settings as SettingsIcon,
  Server,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const { backendConnected, setBackendConnected, datasets } = useAppContext();
  const [healthData, setHealthData] = useState(null);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const data = await checkHealth();
      setHealthData(data);
      setBackendConnected(true);
    } catch {
      setHealthData(null);
      setBackendConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">
          System configuration and connection status
        </p>
      </div>

      {/* Backend Connection */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-light">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Backend Connection
            </h2>
          </div>
          <button
            onClick={runHealthCheck}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {checking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Check
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                backendConnected ? "bg-success-50" : "bg-error-50"
              }`}
            >
              {backendConnected ? (
                <Wifi size={18} className="text-success" />
              ) : (
                <WifiOff size={18} className="text-error" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {backendConnected ? "Connected" : "Disconnected"}
              </p>
              <p className="text-xs text-text-muted">
                {backendConnected
                  ? "Backend server is running and responding"
                  : "Unable to reach the backend server"}
              </p>
            </div>
          </div>

          {healthData && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="rounded-lg bg-surface-light p-3">
                <p className="text-xs text-text-muted">Tables Loaded</p>
                <p className="text-lg font-bold text-text-primary">
                  {healthData.tables_loaded}
                </p>
              </div>
              <div className="rounded-lg bg-surface-light p-3">
                <p className="text-xs text-text-muted">Total Rows</p>
                <p className="text-lg font-bold text-text-primary">
                  {healthData.total_rows?.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Datasets Overview */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-surface-light">
          <Database size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-text-primary">
            Loaded Datasets
          </h2>
        </div>
        <div className="p-5">
          {datasets.length === 0 ? (
            <p className="text-sm text-text-muted">No datasets loaded.</p>
          ) : (
            <div className="space-y-2">
              {datasets.map((ds) => (
                <div
                  key={ds.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-light"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {ds.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {ds.columns?.length} columns
                    </p>
                  </div>
                  <span className="text-xs font-medium text-text-secondary bg-white px-2 py-1 rounded-md border border-border">
                    {ds.row_count?.toLocaleString()} rows
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              About BI Agent
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              AI-powered Business Intelligence agent. Ask questions in plain
              English and get instant charts, tables, and insights from your
              data. Powered by LLM-generated SQL queries executed against
              PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
