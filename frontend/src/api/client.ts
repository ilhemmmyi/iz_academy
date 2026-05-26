/**
 * API client with automatic token management.
 *
 * TOKEN FLOW
 * ──────────
 * Access token  — stored in memory (csrfToken variable); sent as Authorization: Bearer
 * Refresh token — httpOnly cookie; sent automatically by browser via credentials:'include'
 * CSRF token    — stored in memory (csrfToken variable); sent as X-CSRF-Token header
 *                 for every state-changing request (POST/PUT/PATCH/DELETE)
 *
 * CSRF BOOTSTRAP
 * ──────────────
 * Call initCsrf() once at app startup (before any mutations).
 * AuthContext does this automatically before the silent refresh call.
 * The server sets a signed _csrf cookie; initCsrf() stores the raw token in memory.
 * If a request returns 403 CSRF_MISSING/CSRF_INVALID, the client re-fetches the token
 * and retries once.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken: string | null = null;
let csrfToken: string | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

// ── CSRF token management ─────────────────────────────────────────────────────

export const initCsrf = async (): Promise<void> => {
  try {
    const res = await fetch(`${BASE_URL}/auth/csrf-token`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    csrfToken = data.csrfToken ?? null;
  } catch {
    // Non-fatal: all state-changing requests will return 403 and retry
  }
};

const refreshCsrf = async (): Promise<void> => {
  await initCsrf();
};

// ── Refresh token management ──────────────────────────────────────────────────

// Single refresh at a time — prevents race condition when multiple 401s fire simultaneously
let refreshPromise: Promise<string | null> | null = null;

// Deduplicate concurrent GET requests to the same path.
const inFlight = new Map<string, Promise<any>>();

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      // /auth/refresh is exempt from CSRF — no X-CSRF-Token header needed
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

// ── Core fetch wrapper ────────────────────────────────────────────────────────

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const _fetch = async (
  path: string,
  options: RequestInit,
  isGetRequest: boolean,
  isCsrfRetry = false,
): Promise<any> => {
  const isFormData = options.body instanceof FormData;
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutation = MUTATION_METHODS.has(method);

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  // Attach CSRF token for every state-changing request
  if (isMutation && csrfToken) headers['X-CSRF-Token'] = csrfToken;

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    cache: isGetRequest ? 'no-store' : options.cache,
    headers,
    credentials: 'include',
  });

  // CSRF token expired or missing → refresh once and retry
  if (res.status === 403 && !isCsrfRetry) {
    const body = await res.json().catch(() => ({}));
    if (body?.code === 'CSRF_MISSING' || body?.code === 'CSRF_INVALID') {
      await refreshCsrf();
      return _fetch(path, options, isGetRequest, true);
    }
    // Re-construct the error so the caller sees it
    throw new Error(body?.message ?? 'Forbidden');
  }

  // Access token expired → refresh once and retry
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      if (isMutation && csrfToken) headers['X-CSRF-Token'] = csrfToken;
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
