import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const API_PATH = `${API_BASE}/api`;

/**
 * Get the current auth token from Supabase session.
 * Returns null if not authenticated.
 */
async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Build headers with auth token for API requests.
 */
async function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithRetry(url, options = {}, retries = 1) {
  // Inject auth header into every request
  options.headers = await authHeaders(options.headers || {});
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
      // If unauthorized, don't retry - let the app handle it
      if (res.status === 401) {
        throw new Error('Authentication required. Please log in again.');
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

  return fetchJson(`${API_PATH}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchDatasets() {
  return fetchJson(`${API_PATH}/datasets`);
}

export async function deleteDataset(datasetName) {
  return fetchJson(`${API_PATH}/datasets/${encodeURIComponent(datasetName)}`, {
    method: 'DELETE'
  });
}

export async function uploadCSV(file, tableName = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (tableName) formData.append('table_name', tableName);

  return fetchJson(`${API_PATH}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function checkHealth() {
  return fetchJson(`${API_PATH}/health`);
}

export async function fetchPreview(dataset, limit = 100) {
  return fetchJson(`${API_PATH}/preview/${encodeURIComponent(dataset)}?limit=${limit}`);
}

// Export chart data as CSV
export async function exportChartCSV(data, title) {
  const res = await fetchWithRetry(`${API_PATH}/export/chart-csv`, {
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
  return fetchJson(`${API_PATH}/pins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// List all pinned dashboards
export async function fetchPins() {
  return fetchJson(`${API_PATH}/pins`);
}

// Delete a pinned dashboard
export async function deletePin(pinId) {
  return fetchJson(`${API_PATH}/pins/${pinId}`, { method: 'DELETE' });
}

// Get session history
export async function fetchSession(sessionId) {
  return fetchJson(`${API_PATH}/session/${encodeURIComponent(sessionId)}`);
}

// Scheduled reports
export async function createSchedule(payload) {
  return fetchJson(`${API_PATH}/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchSchedules() {
  return fetchJson(`${API_PATH}/schedules`);
}

export async function deleteSchedule(id) {
  return fetchJson(`${API_PATH}/schedules/${id}`, { method: 'DELETE' });
}

export async function toggleSchedule(id) {
  return fetchJson(`${API_PATH}/schedules/${id}/toggle`, { method: 'POST' });
}
