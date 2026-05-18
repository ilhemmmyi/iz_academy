const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

<<<<<<< HEAD
// H-4 — Une seule requête de refresh à la fois (évite la race condition)
let refreshPromise: Promise<string | null> | null = null;
=======
// Deduplicate concurrent GET requests to the same path.
// If two components mount simultaneously and call the same endpoint, they share
// one in-flight Promise instead of firing two identical requests.
const inFlight = new Map<string, Promise<any>>();
>>>>>>> 6dfd6ce476b5abeefbd7f2e2602c6d05dbf5f9fd

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      accessToken = data.accessToken;
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

const _fetch = async (path: string, options: RequestInit, isGetRequest: boolean): Promise<any> => {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    cache: isGetRequest ? 'no-store' : options.cache,
    headers,
    credentials: 'include',
  });

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

  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
};

export const apiClient = (path: string, options: RequestInit = {}): Promise<any> => {
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';

  if (isGetRequest) {
    const existing = inFlight.get(path);
    if (existing) return existing;
    const promise = _fetch(path, options, true).finally(() => inFlight.delete(path));
    inFlight.set(path, promise);
    return promise;
  }

  return _fetch(path, options, false);
};