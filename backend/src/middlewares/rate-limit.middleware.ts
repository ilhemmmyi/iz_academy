/**
 * Centralized rate limiting middleware.
 *
 * All endpoint-specific limiters live here so limits are auditable in one
 * place and share a single handler that fires SECURITY.RATE_LIMIT audit events.
 *
 * Per-user vs per-IP:
 *   - keyBy: 'user'  — authenticated routes; isolated per userId so shared
 *                      networks (offices, universities) don't interfere.
 *   - keyBy: 'ip'    — unauthenticated endpoints (login, register, contact).
 *
 * Redis upgrade path (horizontal scaling):
 *   1. npm install rate-limit-redis
 *   2. import { RedisStore } from 'rate-limit-redis';
 *   3. In createLimiter(), pass:
 *        store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) })
 *   All named limiters inherit the change automatically.
 *
 * Env vars (all optional — sane defaults shown):
 *   RATE_LIMIT_AUTH_MAX=5          Login / Google login
 *   RATE_LIMIT_UPLOAD_MAX=20       File uploads per user / hour
 *   RATE_LIMIT_CERTIFICATE_MAX=5   Certificate retries per user / hour
 */

import rateLimit, { ipKeyGenerator as rlIpKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { AuditService, extractRequestContext } from '../services/audit.service';
import type { AuthRequest } from './auth.middleware';

// ── Key generators ─────────────────────────────────────────────────────────────

/**
 * Per-user key generator.
 * Authenticated users are rate-limited by userId rather than IP so that
 * users on shared networks (NAT, VPNs) cannot inadvertently block each other.
 * Falls back to IP (via the library helper that normalises IPv6) for unauthenticated requests.
 */
export const userKeyGenerator = (req: Request): string =>
  (req as AuthRequest).user?.userId ?? rlIpKeyGenerator(req.ip ?? 'anonymous');

/**
 * Per-IP key generator — for endpoints that are hit before auth
 * (login, register, forgot-password, contact form).
 * Uses the library helper so IPv6 addresses are normalised correctly.
 */
export const ipKeyGenerator = (req: Request): string =>
  rlIpKeyGenerator(req.ip ?? 'anonymous');

// ── Factory ────────────────────────────────────────────────────────────────────

export interface LimiterOptions {
  windowMs: number;
  max:      number;
  keyBy?:   'ip' | 'user';
}

/**
 * Create a rate limiter middleware.
 * In development NODE_ENV the effective max is multiplied by 20 so normal
 * coding / testing is never impeded; exact production limits apply in production.
 */
export function createLimiter({ windowMs, max, keyBy = 'ip' }: LimiterOptions) {
  const isProd   = process.env.NODE_ENV === 'production';
  const effectiveMax = isProd ? max : max * 20;

  return rateLimit({
    windowMs,
    max:             effectiveMax,
    standardHeaders: true,
    legacyHeaders:   false,
    keyGenerator:    keyBy === 'user' ? userKeyGenerator : ipKeyGenerator,
    handler(req: Request, res: Response) {
      // Retry-After in seconds so clients know when to try again
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      AuditService.security({
        actorId:   (req as AuthRequest).user?.userId ?? null,
        actorRole: (req as AuthRequest).user?.role,
        action:    'SECURITY.RATE_LIMIT',
        targetType: 'Route',
        targetId:  req.path,
        payload:   { method: req.method, limit: effectiveMax },
        ...extractRequestContext(req),
      });
      res.status(429).json({ success: false, error: 'Too many requests' });
    },
  });
}

// ── Auth limiters (IP-keyed — unauthenticated at call time) ───────────────────

/** 5 attempts / 15 min — login and Google OAuth */
export const authLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_AUTH_MAX) || 5,
  keyBy:    'ip',
});

/** 5 registrations / hour per IP */
export const authRegisterLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      5,
  keyBy:    'ip',
});

/** 3 forgot-password requests / hour per IP */
export const authForgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      3,
  keyBy:    'ip',
});

/** 5 password-reset completions / 15 min per IP */
export const authResetPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      5,
  keyBy:    'ip',
});

/** 20 token-refresh calls / 15 min per IP — anti-flooding */
export const authRefreshLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      20,
  keyBy:    'ip',
});

// ── Upload limiters (user-keyed) ───────────────────────────────────────────────

/** 20 file uploads / hour per user — prevents storage flooding */
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 20,
  keyBy:    'user',
});

// ── Certificate limiter (user-keyed) ──────────────────────────────────────────

/** 5 certificate retries / hour per user — prevents PDF worker overload */
export const certificateRetryLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_CERTIFICATE_MAX) || 5,
  keyBy:    'user',
});

// ── Project limiter (user-keyed) ───────────────────────────────────────────────

/** 10 project submissions / hour per user */
export const projectSubmitLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      10,
  keyBy:    'user',
});

// ── AI limiter (user-keyed) ────────────────────────────────────────────────────

/** 20 AI recommendation calls / hour per user — protects HuggingFace quota */
export const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      20,
  keyBy:    'user',
});

// ── Contact limiter (IP-keyed — publicly accessible) ──────────────────────────

/** 5 contact form submissions / hour per IP — prevents email spam */
export const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      5,
  keyBy:    'ip',
});

// ── Enrollment limiter (user-keyed) ───────────────────────────────────────────

/** 10 enrollment requests / hour per user */
export const enrollmentRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      10,
  keyBy:    'user',
});

// ── Quiz limiter (user-keyed) ──────────────────────────────────────────────────

/** 30 quiz attempts / hour per user */
export const quizAttemptLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      30,
  keyBy:    'user',
});

// ── Report limiter (user-keyed) ────────────────────────────────────────────────

/** 10 reports / hour per user */
export const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      10,
  keyBy:    'user',
});

// ── Message limiter (user-keyed) ───────────────────────────────────────────────

/** 30 messages / minute per user */
export const messageLimiter = createLimiter({
  windowMs: 60 * 1000,
  max:      30,
  keyBy:    'user',
});

// ── Admin action limiter (user-keyed) ─────────────────────────────────────────

/** 30 sensitive admin writes / 10 min per user */
export const adminActionLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max:      30,
  keyBy:    'user',
});
