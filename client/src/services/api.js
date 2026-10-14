const API_BASE = import.meta.env.VITE_API_BASE || 'https://user-analytics-server-n8cp.onrender.com/api';

export const fetchSessions = async () => {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
};

export const fetchSessionJourney = async (sessionId) => {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/events`);
  if (!res.ok) throw new Error('Failed to fetch session events');
  return res.json();
};

export const fetchHeatmapData = async (url = '') => {
  const query = url ? `?url=${encodeURIComponent(url)}` : '';
  const res = await fetch(`${API_BASE}/heatmap${query}`);
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return res.json();
};
