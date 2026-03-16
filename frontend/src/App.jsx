import { useState, useCallback, useRef, useEffect } from "react";
import { Database, Upload as UploadIcon, MessageSquare, ChevronDown, ChevronUp, BarChart3, Sparkles } from "lucide-react";
import ChatInput from "./components/ChatInput";
import Dashboard from "./components/Dashboard";
import LoadingState from "./components/LoadingState";
import ChatHistory from "./components/ChatHistory";
import FileUpload from "./components/FileUpload";
import { sendQuery, fetchDatasets } from "./utils/api";

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);
  const dashboardRef = useRef(null);

  // Load datasets on mount
  useEffect(() => {
    fetchDatasets()
      .then((data) => {
        setDatasets(data.datasets || []);
        if (data.datasets?.length) setActiveDataset(data.datasets[0].name);
        setBackendConnected(true);
      })
      .catch(() => setBackendConnected(false));
  }, []);

  const handleQuery = useCallback(
    async (prompt) => {
      setIsLoading(true);
      setDashboardData(null);

      try {
        const result = await sendQuery(prompt, sessionId, activeDataset);
        setDashboardData(result);

        // Add to chat history
        setChatHistory((prev) => [
          ...prev,
          {
            prompt,
            chartsCount: result.charts?.length || 0,
            queryTime: result.metadata?.query_time_ms,
          },
        ]);

        // Scroll to dashboard
        setTimeout(() => {
          dashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      } catch (err) {
        setDashboardData({
          error: err.message || "Something went wrong. Please try again.",
          charts: [],
          insights: [],
        });
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, activeDataset]
  );

  const handleUploadSuccess = (result) => {
    setActiveDataset(result.table_name);
    fetchDatasets().then((data) => setDatasets(data.datasets || []));
  };

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      {/* Gradient Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BarChart3 size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BI Dashboard AI
                </h1>
                <p className="text-[11px] text-text-muted -mt-0.5">Powered by Llama 3.3</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dataset Indicator */}
              {activeDataset && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-light border border-border text-xs">
                  <Database size={13} className="text-accent" />
                  <span className="text-text-secondary">{activeDataset}</span>
                  {datasets.find(d => d.name === activeDataset) && (
                    <span className="text-text-muted">
                      ({datasets.find(d => d.name === activeDataset).row_count.toLocaleString()} rows)
                    </span>
                  )}
                </div>
              )}

              {/* Upload Toggle */}
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  showUpload
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-surface-light text-text-secondary border border-border hover:border-primary/30"
                }`}
              >
                <UploadIcon size={13} />
                Upload CSV
              </button>

              {/* Connection Status */}
              <div className={`w-2 h-2 rounded-full ${backendConnected ? "bg-success" : "bg-error animate-pulse"}`}
                title={backendConnected ? "Backend connected" : "Backend disconnected"} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Upload Section */}
          {showUpload && (
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Hero Section (shown when no dashboard) */}
          {!dashboardData && !isLoading && chatHistory.length === 0 && (
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <Sparkles size={14} />
                Ask anything about your data
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                Turn questions into
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> dashboards</span>
              </h2>
              <p className="text-text-muted max-w-md mx-auto">
                Type a natural language question and get interactive charts and insights instantly. No SQL required.
              </p>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && !isLoading && (
            <ChatHistory history={chatHistory} />
          )}

          {/* Input */}
          <div className="max-w-3xl mx-auto mb-8">
            <ChatInput
              onSubmit={handleQuery}
              isLoading={isLoading}
              disabled={!backendConnected}
            />
          </div>

          {/* Loading */}
          {isLoading && <LoadingState />}

          {/* Dashboard */}
          {!isLoading && dashboardData && (
            <div ref={dashboardRef}>
              <Dashboard data={dashboardData} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-4 mt-12">
          <p className="text-center text-xs text-text-muted">
            Built with FastAPI, Groq (Llama 3.3 70B), React & Recharts
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
