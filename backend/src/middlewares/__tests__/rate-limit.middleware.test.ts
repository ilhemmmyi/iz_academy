/**
 * rate-limit.middleware — unit + functional tests.
 *
 * Verifies:
 *   ✅  normal requests pass (next() called)
 *   ❌  excessive requests blocked (429 + standard body)
 *   ✅  per-user key uses userId when authenticated
 *   ✅  IP fallback when userId absent
 *   ✅  Retry-After header is set on blocked responses
 *   ✅  SECURITY.RATE_LIMIT audit event fired when blocked
 *   ✅  named limiters are exported as middleware functions
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
// Must be at top so Jest hoisting applies before any import resolves.

jest.mock('../../services/audit.service', () => ({
  AuditService: { security: jest.fn() },
  extractRequestContext: jest.fn().mockReturnValue({ ip: '1.2.3.4', userAgent: 'test-agent', correlationId: undefined }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import {
  createLimiter,
  userKeyGenerator,
  ipKeyGenerator,
  authLoginLimiter,
  authRegisterLimiter,
  authForgotPasswordLimiter,
  authResetPasswordLimiter,
  authRefreshLimiter,
  uploadLimiter,
  certificateRetryLimiter,
  projectSubmitLimiter,
  aiLimiter,
  contactLimiter,
  enrollmentRequestLimiter,
  quizAttemptLimiter,
  reportLimiter,
  messageLimiter,
  adminActionLimiter,
} from '../rate-limit.middleware';
import { AuditService } from '../../services/audit.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal req mock — extend per test. */
function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: '127.0.0.1',
    path: '/test',
    method: 'POST',
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

/** Minimal res mock with chainable methods. */
function makeRes() {
  const res = {
    setHeader: jest.fn().mockReturnThis(),
    getHeader:  jest.fn().mockReturnValue(undefined),
    set:        jest.fn().mockReturnThis(),
    removeHeader: jest.fn(),
    status:     jest.fn().mockReturnThis(),
    json:       jest.fn().mockReturnThis(),
    send:       jest.fn().mockReturnThis(),
    end:        jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

/**
 * Invoke an express middleware and return whether `next` was called.
 * Waits one event-loop turn to let express-rate-limit's async store resolve.
 */
async function invoke(
  mw: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
  res: Response,
): Promise<boolean> {
  let nextCalled = false;
  mw(req, res, () => { nextCalled = true; });
  // Flush the microtask queue (MemoryStore.increment is async-wrapped)
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  return nextCalled;
}

// ── Key generator tests ───────────────────────────────────────────────────────

describe('userKeyGenerator()', () => {
  it('returns userId when user is authenticated', () => {
    const req = makeReq({ user: { userId: 'user-abc', role: 'STUDENT', email: 'x@x.com' } } as any);
    expect(userKeyGenerator(req)).toBe('user-abc');
  });

  it('falls back to req.ip when user is not present', () => {
    const req = makeReq({ ip: '203.0.113.1' });
    expect(userKeyGenerator(req)).toBe('203.0.113.1');
  });

  it('returns "anonymous" when both user and ip are absent', () => {
    const req = makeReq({ ip: undefined });
    expect(userKeyGenerator(req)).toBe('anonymous');
  });
});

describe('ipKeyGenerator()', () => {
  it('returns req.ip', () => {
    const req = makeReq({ ip: '198.51.100.5' });
    expect(ipKeyGenerator(req)).toBe('198.51.100.5');
  });

  it('returns "anonymous" when ip is absent', () => {
    const req = makeReq({ ip: undefined });
    expect(ipKeyGenerator(req)).toBe('anonymous');
  });
});

// ── createLimiter — pass / block behaviour ────────────────────────────────────

describe('createLimiter() — rate enforcement', () => {
  it('passes the first request (next is called)', async () => {
    // In test env (not production) max is multiplied by 20, so use 1 to get effective 20.
    // To get exact blocking with max: 1 we need to override NODE_ENV.
    // Easiest: just confirm next() IS called for the very first request.
    const limiter = createLimiter({ windowMs: 60_000, max: 100, keyBy: 'ip' });
    const req = makeReq({ ip: '10.0.0.1' });
    const res = makeRes();
    const passed = await invoke(limiter, req, res);
    expect(passed).toBe(true);
    expect(res.status).not.toHaveBeenCalledWith(429);
  });

  it('blocks requests after limit exceeded and returns standard 429 body', async () => {
    // Force a 1-request limit — in production NODE_ENV the multiplier is not applied.
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const limiter = createLimiter({ windowMs: 60_000, max: 1, keyBy: 'ip' });
      const req = makeReq({ ip: '10.1.1.1' });

      // First request — should pass
      await invoke(limiter, req, makeRes());

      // Second request — should be blocked
      const res2 = makeRes();
      const passed = await invoke(limiter, req, res2);

      expect(passed).toBe(false);
      expect(res2.status).toHaveBeenCalledWith(429);
      expect(res2.json).toHaveBeenCalledWith({ success: false, error: 'Too many requests' });
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it('sets Retry-After header when blocking', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const limiter = createLimiter({ windowMs: 120_000, max: 1, keyBy: 'ip' });
      const req = makeReq({ ip: '10.2.2.2' });

      await invoke(limiter, req, makeRes());  // exhaust

      const res2 = makeRes();
      await invoke(limiter, req, res2);

      expect(res2.setHeader).toHaveBeenCalledWith('Retry-After', 120); // 120_000ms / 1000
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it('fires SECURITY.RATE_LIMIT audit event on block', async () => {
    const mockSecurity = AuditService.security as jest.Mock;
    mockSecurity.mockClear();

    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const limiter = createLimiter({ windowMs: 60_000, max: 1, keyBy: 'ip' });
      const req = makeReq({ ip: '10.3.3.3' });

      await invoke(limiter, req, makeRes());  // exhaust
      await invoke(limiter, req, makeRes());  // triggers handler

      expect(mockSecurity).toHaveBeenCalledTimes(1);
      expect(mockSecurity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SECURITY.RATE_LIMIT' }),
      );
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it('does NOT fire audit event for requests within the limit', async () => {
    const mockSecurity = AuditService.security as jest.Mock;
    mockSecurity.mockClear();

    const limiter = createLimiter({ windowMs: 60_000, max: 100, keyBy: 'ip' });
    await invoke(limiter, makeReq({ ip: '10.4.4.4' }), makeRes());

    expect(mockSecurity).not.toHaveBeenCalled();
  });
});

// ── Per-user vs per-IP isolation ──────────────────────────────────────────────

describe('createLimiter() — key isolation', () => {
  it('user-keyed limiter counts separately per userId', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const limiter = createLimiter({ windowMs: 60_000, max: 1, keyBy: 'user' });

      const reqA = makeReq({ user: { userId: 'userA', role: 'STUDENT', email: '' } } as any);
      const reqB = makeReq({ user: { userId: 'userB', role: 'STUDENT', email: '' } } as any);

      await invoke(limiter, reqA, makeRes()); // exhausts userA

      // userA is now blocked
      const resA2 = makeRes();
      const passedA = await invoke(limiter, reqA, resA2);
      expect(passedA).toBe(false);
      expect(resA2.status).toHaveBeenCalledWith(429);

      // userB is on a separate key — first request should still pass
      const resB = makeRes();
      const passedB = await invoke(limiter, reqB, resB);
      expect(passedB).toBe(true);
      expect(resB.status).not.toHaveBeenCalledWith(429);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});

// ── Named limiters smoke test ─────────────────────────────────────────────────

describe('named limiters — exported as middleware functions', () => {
  const limiters = [
    authLoginLimiter,
    authRegisterLimiter,
    authForgotPasswordLimiter,
    authResetPasswordLimiter,
    authRefreshLimiter,
    uploadLimiter,
    certificateRetryLimiter,
    projectSubmitLimiter,
    aiLimiter,
    contactLimiter,
    enrollmentRequestLimiter,
    quizAttemptLimiter,
    reportLimiter,
    messageLimiter,
    adminActionLimiter,
  ];

  limiters.forEach((limiter, i) => {
    it(`limiter[${i}] is a callable middleware`, () => {
      expect(typeof limiter).toBe('function');
    });
  });
});
