const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    return null;
  }
};

export const apiClient = async (path: string, options: RequestInit = {}): Promise<any> => {
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isGetRequest ? { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' } : {}),
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    cache: isGetRequest ? 'no-store' : options.cache,
    headers,
    credentials: 'include',
  });

  // Auto-refresh if 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        cache: isGetRequest ? 'no-store' : options.cache,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message);
  }

  // Handle empty responses (e.g. 204 No Content or empty body)
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
};
