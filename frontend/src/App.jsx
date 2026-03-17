import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import QueryPage from "./pages/QueryPage";
import ExplorerPage from "./pages/ExplorerPage";
import HistoryPage from "./pages/HistoryPage";
import UploadPage from "./pages/UploadPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/query" element={<QueryPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
