/**
 * CSRF protection — HMAC double-submit cookie pattern.
 *
 * WHY THIS ARCHITECTURE IS ALREADY PARTIALLY CSRF-SAFE
 * ─────────────────────────────────────────────────────
 * All authenticated endpoints require an "Authorization: Bearer <token>" header.
 * The access token lives in JavaScript memory (not a cookie), so a cross-site
 * attacker cannot include it in a forged request — browsers only auto-send
 * cookies, not arbitrary JS variables.
 *
 * Additionally the refreshToken cookie uses sameSite=strict, blocking every
 * cross-site request from including it.
 *
 * WHAT THIS ADDS
 * ─────────────────────────────────────────────────────
 * Defense-in-depth for:
 *   • Future endpoints that might use cookie-only auth
 *   • Browser sameSite implementation bugs
 *   • Subdomain cookie injection attacks (HMAC signing prevents token forgery)
 *   • Compliance requirements that mandate explicit CSRF tokens
 *
 * HOW THE DOUBLE-SUBMIT HMAC PATTERN WORKS
 * ─────────────────────────────────────────────────────
 * 1. Client calls GET /api/auth/csrf-token (safe, no CSRF needed).
 *    Server responds with  { csrfToken: "<raw>" }
 *    and sets cookie:      _csrf=<raw>.<hmac(raw,secret)>; httpOnly=false; sameSite=strict
 *
 * 2. For every state-changing request the client sends:
 *    X-CSRF-Token: <raw>
 *
 * 3. Server validates:
 *    a) raw part of cookie === X-CSRF-Token header value
 *    b) hmac(header, secret) === hmac part of cookie (timing-safe)
 *
 * An attacker can forge a request with a cookie value they set, but cannot
 * compute a valid HMAC without the server secret, so (b) rejects them.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const CSRF_COOKIE = '_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Routes that bypass CSRF:
 *   - Public auth endpoints: no session/cookie exists yet to double-submit
 *   - Cookie-session endpoints (refresh, logout): protected by sameSite=strict
 */
const EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/health',
]);

function sign(raw: string): string {
  return crypto.createHmac('sha256', config.csrfSecret).update(raw).digest('hex');
}

/**
 * Issues a fresh CSRF token pair:
 *   - Sets a signed _csrf cookie (httpOnly=false — must be JS-readable)
 *   - Returns the raw (unsigned) token to be stored by the client
 *
 * Always generates a new token; intended for GET /api/auth/csrf-token.
 */
export function issueCsrfToken(req: Request, res: Response): string {
  const raw = crypto.randomBytes(32).toString('hex');
  const hmac = sign(raw);
  res.cookie(CSRF_COOKIE, `${raw}.${hmac}`, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
  return raw;
}

/**
 * Global CSRF protection middleware.
 *
 * Must be registered AFTER cookieParser in app.ts.
 * Skips safe methods and explicitly exempt routes.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) { next(); return; }
  if (EXEMPT_PATHS.has(req.path)) { next(); return; }

  const cookieValue: string | undefined = req.cookies?.[CSRF_COOKIE];
  const headerValue = (req.headers[CSRF_HEADER] as string | undefined)?.trim();

  if (!cookieValue || !headerValue) {
    res.status(403).json({ message: 'CSRF token missing', code: 'CSRF_MISSING' });
    return;
  }

  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex < 1) {
    res.status(403).json({ message: 'CSRF token malformed', code: 'CSRF_INVALID' });
    return;
  }

  const cookieRaw = cookieValue.slice(0, dotIndex);
  const cookieHmac = cookieValue.slice(dotIndex + 1);

  // Constant-time check 1: header value must equal the raw part of the cookie
  try {
    const rawBuf = Buffer.from(cookieRaw);
    const hdrBuf = Buffer.from(headerValue);
    if (
      rawBuf.length !== hdrBuf.length ||
      !crypto.timingSafeEqual(rawBuf, hdrBuf)
    ) {
      res.status(403).json({ message: 'CSRF token invalid', code: 'CSRF_INVALID' });
      return;
    }
  } catch {
    res.status(403).json({ message: 'CSRF token invalid', code: 'CSRF_INVALID' });
    return;
  }

  // Constant-time check 2: HMAC of the header value must match the cookie HMAC
  const expectedHmac = sign(headerValue);
  try {
    const expected = Buffer.from(expectedHmac, 'hex');
    const actual = Buffer.from(cookieHmac, 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      res.status(403).json({ message: 'CSRF token invalid', code: 'CSRF_INVALID' });
      return;
    }
  } catch {
    res.status(403).json({ message: 'CSRF token invalid', code: 'CSRF_INVALID' });
    return;
  }

  next();
}
