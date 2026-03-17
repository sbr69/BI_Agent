const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export async function sendQuery(prompt, sessionId = null, dataset = null) {
  const body = { prompt };
  if (sessionId) body.session_id = sessionId;
  if (dataset) body.dataset = dataset;

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
