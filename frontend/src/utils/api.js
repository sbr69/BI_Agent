const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  return headers;
}

async function fetchWithRetry(url, options = {}, retries = 1) {
  // Inject API key header into every request
  options.headers = authHeaders(options.headers || {});
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errDetail = `HTTP Error ${res.status}`;
      try {
        const err = await res.json();
        errDetail = err.detail || err.message || errDetail;
      } catch {
        // Ignore JSON parsing errors for error bodies
      }
      throw new Error(errDetail);
    }
    return res;
  } catch (error) {
    if (retries > 0 && error.message.includes('fetch')) {
      // Retry on network errors
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

async function fetchJson(url, options = {}, retries = 1) {
  const res = await fetchWithRetry(url, options, retries);
  return res.json();
}

export async function sendQuery(prompt, sessionId = null, dataset = null, dateFrom = null, dateTo = null) {
  const body = { prompt };
  if (sessionId) body.session_id = sessionId;
  if (dataset) body.dataset = dataset;
  if (dateFrom) body.date_from = dateFrom;
  if (dateTo) body.date_to = dateTo;

  return fetchJson(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchDatasets() {
  return fetchJson(`${API_BASE}/datasets`);
}

export async function deleteDataset(datasetName) {
  return fetchJson(`${API_BASE}/datasets/${encodeURIComponent(datasetName)}`, {
    method: 'DELETE'
  });
}

export async function uploadCSV(file, tableName = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (tableName) formData.append('table_name', tableName);

  return fetchJson(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function checkHealth() {
  return fetchJson(`${API_BASE}/health`);
}

export async function fetchPreview(dataset, limit = 100) {
  return fetchJson(`${API_BASE}/preview/${encodeURIComponent(dataset)}?limit=${limit}`);
}

// Export chart data as CSV
export async function exportChartCSV(data, title) {
  const res = await fetchWithRetry(`${API_BASE}/export/chart-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, title }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 50)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Pin a dashboard tile
export async function pinDashboard(payload) {
  return fetchJson(`${API_BASE}/pins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// List all pinned dashboards
export async function fetchPins() {
  return fetchJson(`${API_BASE}/pins`);
}

// Delete a pinned dashboard
export async function deletePin(pinId) {
  return fetchJson(`${API_BASE}/pins/${pinId}`, { method: 'DELETE' });
}

// Get session history
export async function fetchSession(sessionId) {
  return fetchJson(`${API_BASE}/session/${encodeURIComponent(sessionId)}`);
}

// Scheduled reports
export async function createSchedule(payload) {
  return fetchJson(`${API_BASE}/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchSchedules() {
  return fetchJson(`${API_BASE}/schedules`);
}

export async function deleteSchedule(id) {
  return fetchJson(`${API_BASE}/schedules/${id}`, { method: 'DELETE' });
}

export async function toggleSchedule(id) {
  return fetchJson(`${API_BASE}/schedules/${id}/toggle`, { method: 'POST' });
}
