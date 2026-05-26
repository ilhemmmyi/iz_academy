/**
 * Tests for the HMAC double-submit CSRF middleware.
 *
 * Architecture note: all "real" authenticated endpoints already require a
 * Bearer token (in-memory, not a cookie), making them immune to CSRF.
 * These tests verify the defence-in-depth layer for edge cases and future
 * cookie-reliant endpoints.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Provide a known secret BEFORE the middleware module is loaded
jest.mock('../../config', () => ({
  config: { csrfSecret: 'test-csrf-secret-32-chars-exactly!!' },
}));

import { csrfProtection, issueCsrfToken, CSRF_COOKIE, CSRF_HEADER } from '../csrf.middleware';

// ── helpers ────────────────────────────────────────────────────────────────────

const SECRET = 'test-csrf-secret-32-chars-exactly!!';

function buildSignedCookie(raw: string): string {
  const hmac = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  return `${raw}.${hmac}`;
}

function buildReq(overrides: Partial<{
  method: string;
  path: string;
  cookies: Record<string, string>;
  headers: Record<string, string>;
}>): Request {
  return {
    method: overrides.method ?? 'POST',
    path: overrides.path ?? '/api/courses',
    cookies: overrides.cookies ?? {},
    headers: overrides.headers ?? {},
  } as unknown as Request;
}

function buildRes(): Response & { _status?: number; _body?: any } {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res as Response;
}

// ── issueCsrfToken ─────────────────────────────────────────────────────────────

describe('issueCsrfToken', () => {
  it('sets a _csrf cookie and returns the raw token', () => {
    const req = { cookies: {} } as unknown as Request;
    const res = buildRes();

    const raw = issueCsrfToken(req, res);

    expect(raw).toHaveLength(64); // 32 bytes hex
    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE,
      expect.stringContaining(raw),
      expect.objectContaining({ httpOnly: false, sameSite: 'strict' }),
    );
    const [cookieRaw] = (res.cookie as jest.Mock).mock.calls[0][1].split('.');
    expect(cookieRaw).toBe(raw);
  });
});

// ── csrfProtection — method exemptions ────────────────────────────────────────

describe('csrfProtection — safe methods', () => {
  const next = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it.each(['GET', 'HEAD', 'OPTIONS'])('%s bypasses CSRF check', (method) => {
    const req = buildReq({ method, cookies: {}, headers: {} });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ── csrfProtection — route exemptions ─────────────────────────────────────────

describe('csrfProtection — exempt routes', () => {
  const next = jest.fn();
  const EXEMPT_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health',
  ];

  beforeEach(() => jest.clearAllMocks());

  it.each(EXEMPT_ROUTES)('POST %s bypasses CSRF check', (path) => {
    const req = buildReq({ method: 'POST', path, cookies: {}, headers: {} });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ── csrfProtection — enforcement ──────────────────────────────────────────────

describe('csrfProtection — enforcement on state-changing requests', () => {
  const next = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('rejects when CSRF cookie is missing', () => {
    const req = buildReq({ cookies: {}, headers: { [CSRF_HEADER]: 'some-token' } });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CSRF_MISSING' }));
  });

  it('rejects when X-CSRF-Token header is missing', () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const req = buildReq({ cookies: { [CSRF_COOKIE]: buildSignedCookie(raw) }, headers: {} });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CSRF_MISSING' }));
  });

  it('passes when cookie and header match (valid token)', () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const req = buildReq({
      cookies: { [CSRF_COOKIE]: buildSignedCookie(raw) },
      headers: { [CSRF_HEADER]: raw },
    });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects when header token does not match cookie raw value', () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const differentRaw = crypto.randomBytes(32).toString('hex');
    const req = buildReq({
      cookies: { [CSRF_COOKIE]: buildSignedCookie(raw) },
      headers: { [CSRF_HEADER]: differentRaw },
    });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CSRF_INVALID' }));
  });

  it('rejects when cookie HMAC has been tampered with', () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const tamperedCookie = `${raw}.ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;
    const req = buildReq({
      cookies: { [CSRF_COOKIE]: tamperedCookie },
      headers: { [CSRF_HEADER]: raw },
    });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CSRF_INVALID' }));
  });

  it('rejects malformed cookie (no dot separator)', () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const req = buildReq({
      cookies: { [CSRF_COOKIE]: raw }, // missing .hmac
      headers: { [CSRF_HEADER]: raw },
    });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it.each(['PUT', 'PATCH', 'DELETE'])('%s method is protected', (method) => {
    const raw = crypto.randomBytes(32).toString('hex');
    const req = buildReq({
      method,
      cookies: { [CSRF_COOKIE]: buildSignedCookie(raw) },
      headers: { [CSRF_HEADER]: raw },
    });
    const res = buildRes();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1); // valid token should pass
  });
});
