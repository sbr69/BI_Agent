const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export async function sendQuery(prompt, sessionId = null, dataset = null, dateFrom = null, dateTo = null) {
  const body = { prompt };
  if (sessionId) body.session_id = sessionId;
  if (dataset) body.dataset = dataset;
  if (dateFrom) body.date_from = dateFrom;
  if (dateTo) body.date_to = dateTo;

  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error("Failed to fetch datasets");
  return res.json();
}

export async function uploadCSV(file, tableName = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (tableName) formData.append("table_name", tableName);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchPreview(dataset, limit = 100) {
  const res = await fetch(`${API_BASE}/preview/${encodeURIComponent(dataset)}?limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Preview failed");
  }
  return res.json();
}

// Export chart data as CSV
export async function exportChartCSV(data, title) {
  const res = await fetch(`${API_BASE}/export/chart-csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, title }),
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 50)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Pin a dashboard tile
export async function pinDashboard(payload) {
  const res = await fetch(`${API_BASE}/pins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to pin dashboard");
  return res.json();
}

// List all pinned dashboards
export async function fetchPins() {
  const res = await fetch(`${API_BASE}/pins`);
  if (!res.ok) throw new Error("Failed to fetch pins");
  return res.json();
}

// Delete a pinned dashboard
export async function deletePin(pinId) {
  const res = await fetch(`${API_BASE}/pins/${pinId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete pin");
  return res.json();
}

// Get session history
export async function fetchSession(sessionId) {
  const res = await fetch(`${API_BASE}/session/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error("Failed to fetch session");
  return res.json();
}

// Scheduled reports
export async function createSchedule(payload) {
  const res = await fetch(`${API_BASE}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create schedule");
  return res.json();
}

export async function fetchSchedules() {
  const res = await fetch(`${API_BASE}/schedules`);
  if (!res.ok) throw new Error("Failed to fetch schedules");
  return res.json();
}

export async function deleteSchedule(id) {
  const res = await fetch(`${API_BASE}/schedules/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete schedule");
  return res.json();
}

export async function toggleSchedule(id) {
  const res = await fetch(`${API_BASE}/schedules/${id}/toggle`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to toggle schedule");
  return res.json();
}
