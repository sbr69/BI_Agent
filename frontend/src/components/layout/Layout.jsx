/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { fetchDatasets } from "../../utils/api";

const AppContext = createContext(null);

export function useAppContext() {
  return useContext(AppContext);
}

const HISTORY_KEY = "bi_agent_query_history";
const PINS_KEY = "bi_agent_pinned_dashboards";

function loadSavedHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((e) => ({ ...e, timestamp: new Date(e.timestamp) }));
    }
  } catch { /* ignore */ }
  return [];
}

function loadSavedPins() {
  try {
    const saved = localStorage.getItem(PINS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [backendConnected, setBackendConnected] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [dashboardData, setDashboardData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState(loadSavedHistory);
  const [pinnedDashboards, setPinnedDashboards] = useState(loadSavedPins);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchDatasets()
      .then((data) => {
        setDatasets(data.datasets || []);
        if (data.datasets?.length) setActiveDataset(data.datasets[0].name);
        setBackendConnected(true);
      })
      .catch(() => setBackendConnected(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(queryHistory.slice(0, 50)));
    } catch { /* ignore quota errors */ }
  }, [queryHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(pinnedDashboards));
    } catch { /* ignore quota errors */ }
  }, [pinnedDashboards]);

  const refreshDatasets = useCallback(() => {
    fetchDatasets()
      .then((data) => {
        setDatasets(data.datasets || []);
        setBackendConnected(true);
      })
      .catch(() => setBackendConnected(false));
  }, []);

  const addToHistory = useCallback((entry) => {
    setQueryHistory((prev) => [entry, ...prev]);
  }, []);

  const addPin = useCallback((pin) => {
    setPinnedDashboards((prev) => [pin, ...prev]);
  }, []);

  const removePin = useCallback((pinId) => {
    setPinnedDashboards((prev) => prev.filter((p) => p.id !== pinId));
  }, []);

  const ctx = useMemo(() => ({
    datasets,
    setDatasets,
    activeDataset,
    setActiveDataset,
    backendConnected,
    setBackendConnected,
    sessionId,
    dashboardData,
    setDashboardData,
    chatHistory,
    setChatHistory,
    isLoading,
    setIsLoading,
    refreshDatasets,
    queryHistory,
    setQueryHistory,
    addToHistory,
    pinnedDashboards,
    addPin,
    removePin,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  }), [datasets, activeDataset, backendConnected, sessionId, dashboardData, chatHistory, isLoading, refreshDatasets, queryHistory, setQueryHistory, addToHistory, pinnedDashboards, addPin, removePin, dateFrom, dateTo]);

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen bg-surface overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile sidebar — overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <Sidebar
              isMobile
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        <div
          className={`flex-1 flex flex-col min-w-0 transition-[margin] ease-in-out duration-200 ${
            sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"
          }`}
        >
          <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
