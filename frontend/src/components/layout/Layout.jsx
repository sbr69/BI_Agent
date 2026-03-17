import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { fetchDatasets } from "../../utils/api";

const AppContext = createContext(null);

export function useAppContext() {
  return useContext(AppContext);
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [backendConnected, setBackendConnected] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [dashboardData, setDashboardData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);

  useEffect(() => {
    fetchDatasets()
      .then((data) => {
        setDatasets(data.datasets || []);
        if (data.datasets?.length) setActiveDataset(data.datasets[0].name);
        setBackendConnected(true);
      })
      .catch(() => setBackendConnected(false));
  }, []);

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

  const ctx = {
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
    addToHistory,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen bg-surface overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"
          }`}
        >
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
