/**
 * Centralized audit logging service.
 *
 * Design principles:
 *   1. Fire-and-forget — AuditService.log() is synchronous at the call site;
 *      the DB write runs in the background and never blocks a response.
 *   2. Never throws — a logging failure must not degrade the user experience.
 *   3. Payload sanitization — any key matching the SENSITIVE_KEY_RE pattern is
 *      replaced with "[REDACTED]" before persistence.
 *   4. Append-only — no update or delete methods are exposed on this service.
 */

import { Request } from 'express';
import { createHmac, randomUUID } from 'crypto';
import { prisma } from '../config/prisma';
import { config } from '../config';

// ── Action catalogue ──────────────────────────────────────────────────────────

export const AuditAction = {
  // Authentication
  AUTH_LOGIN:                   'AUTH.LOGIN',
  AUTH_LOGOUT:                  'AUTH.LOGOUT',
  AUTH_REGISTER:                'AUTH.REGISTER',
  AUTH_GOOGLE_LOGIN:            'AUTH.GOOGLE_LOGIN',
  AUTH_PASSWORD_RESET_REQUEST:  'AUTH.PASSWORD_RESET_REQUEST',
  AUTH_PASSWORD_RESET_COMPLETE: 'AUTH.PASSWORD_RESET_COMPLETE',
  AUTH_PASSWORD_CHANGE:         'AUTH.PASSWORD_CHANGE',
  AUTH_EMAIL_VERIFIED:          'AUTH.EMAIL_VERIFIED',

  // Security events
  SECURITY_FORBIDDEN_ACCESS:    'SECURITY.FORBIDDEN_ACCESS',
  SECURITY_RATE_LIMIT:          'SECURITY.RATE_LIMIT',

  // User management (admin-only)
  USER_CREATE:               'USER.CREATE',
  USER_DELETE:               'USER.DELETE',
  USER_ROLE_CHANGE:          'USER.ROLE_CHANGE',
  USER_PASSWORD_RESET_ADMIN: 'USER.PASSWORD_RESET.ADMIN',
  USER_ASSIGN_COURSES:       'USER.ASSIGN_COURSES',
  USER_REMOVE_COURSE_ACCESS: 'USER.REMOVE_COURSE_ACCESS',

  // Course lifecycle
  COURSE_CREATE:   'COURSE.CREATE',
  COURSE_UPDATE:   'COURSE.UPDATE',
  COURSE_DELETE:   'COURSE.DELETE',
  COURSE_PUBLISH:  'COURSE.PUBLISH',
  COURSE_UNPUBLISH:'COURSE.UNPUBLISH',

  // Enrollment
  ENROLLMENT_REQUEST:  'ENROLLMENT.REQUEST',
  ENROLLMENT_APPROVED: 'ENROLLMENT.APPROVED',
  ENROLLMENT_REJECTED: 'ENROLLMENT.REJECTED',
  ENROLLMENT_DELETE:   'ENROLLMENT.DELETE',

  // Certificates
  CERTIFICATE_GENERATE: 'CERTIFICATE.GENERATE',
  CERTIFICATE_REVOKE:   'CERTIFICATE.REVOKE',

  // Projects
  PROJECT_SUBMIT:           'PROJECT.SUBMIT',
  PROJECT_SUBMIT_FORBIDDEN: 'PROJECT.SUBMIT_FORBIDDEN',
  PROJECT_REVIEW:           'PROJECT.REVIEW',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

// ── Entry interface ───────────────────────────────────────────────────────────

export interface AuditEntry {
  actorId:       string | null;
  actorRole?:    string | null;
  action:        AuditActionType | string;
  targetType?:   string;
  targetId?:     string;
  payload?:      Record<string, unknown>;
  ip?:           string;
  userAgent?:    string;
  correlationId?:string;
}

// ── Payload sanitization ──────────────────────────────────────────────────────

const SENSITIVE_KEY_RE = /password|token|secret|hash|key|credential|bearer|authorization/i;

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitize);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY_RE.test(k) ? '[REDACTED]' : sanitize(v);
  }
  return out;
}

// ── Request context extractor ─────────────────────────────────────────────────

export function extractRequestContext(req: Request): Pick<AuditEntry, 'ip' | 'userAgent' | 'correlationId'> {
  const fwd = req.headers['x-forwarded-for'];
  const rawIp = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() ?? req.ip;
  return {
    ip:            rawIp?.slice(0, 45),
    userAgent:     (req.headers['user-agent'] ?? '').slice(0, 500) || undefined,
    correlationId: (req as any).correlationId,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const AuditService = {

  /** Convenience wrapper for auth events (AUTH.*). */
  auth(entry: AuditEntry): void { this.log(entry); },

  /** Convenience wrapper for admin actions (USER.*, COURSE.*, etc.). */
  admin(entry: AuditEntry): void { this.log(entry); },

  /**
   * Convenience wrapper for security events (SECURITY.*).
   * Also emits a structured warning to stderr so SIEM tooling can ingest it
   * without polling the database.
   */
  security(entry: AuditEntry): void {
    console.warn('[Security]', JSON.stringify({ action: entry.action, actorId: entry.actorId, ip: entry.ip, target: entry.targetId }));
    this.log(entry);
  },

  /**
   * Write one audit record. Call without `await` — deliberately fire-and-forget.
   * On DB error the failure is logged to stderr but never propagated.
   *
   * ID and createdAt are generated here (not by the DB default) so they can be
   * included in the HMAC checksum before the row is persisted.
   */
  log(entry: AuditEntry): void {
    const id           = randomUUID();
    const createdAt    = new Date();
    const correlationId = entry.correlationId ?? null;
    const actorId      = entry.actorId;
    const actorRole    = entry.actorRole ?? null;
    const action       = entry.action;
    const targetType   = entry.targetType ?? null;
    const targetId     = entry.targetId ?? null;
    const ipAddress    = entry.ip ?? null;
    const userAgent    = entry.userAgent ?? null;
    const sanitizedPayload = entry.payload ? (sanitize(entry.payload) as any) : undefined;

    const checksum = config.auditHmacSecret
      ? createHmac('sha256', config.auditHmacSecret)
          .update(JSON.stringify({ id, correlationId, actorId, actorRole, action, targetType, targetId, ipAddress, userAgent, createdAt: createdAt.toISOString() }))
          .digest('hex')
      : null;

    prisma.auditLog.create({
      data: { id, actorId, actorRole, action, targetType, targetId, payload: sanitizedPayload, ipAddress, userAgent, correlationId, checksum, createdAt },
    }).catch((err: unknown) => {
      console.error('[AuditLog] write failed:', err instanceof Error ? err.message : err);
    });
  },

  /**
   * Verify the HMAC checksum of a stored record.
   * Returns null if AUDIT_HMAC_SECRET is not configured or the record has no checksum.
   */
  verifyChecksum(record: {
    id: string; correlationId: string | null; actorId: string | null; actorRole: string | null;
    action: string; targetType: string | null; targetId: string | null;
    ipAddress: string | null; userAgent: string | null; createdAt: Date; checksum: string | null;
  }): boolean | null {
    if (!config.auditHmacSecret || !record.checksum) return null;
    const expected = createHmac('sha256', config.auditHmacSecret)
      .update(JSON.stringify({
        id: record.id, correlationId: record.correlationId, actorId: record.actorId,
        actorRole: record.actorRole, action: record.action, targetType: record.targetType,
        targetId: record.targetId, ipAddress: record.ipAddress, userAgent: record.userAgent,
        createdAt: record.createdAt.toISOString(),
      }))
      .digest('hex');
    return expected === record.checksum;
  },

  /** Admin query: paginated, filterable, read-only. */
  async query(filters: {
    actorId?:    string;
    action?:     string;
    targetType?: string;
    targetId?:   string;
    from?:       Date;
    to?:         Date;
    page?:       number;
    limit?:      number;
  }) {
    const { actorId, action, targetType, targetId, from, to } = filters;
    const page  = Math.max(1, filters.page  ?? 1);
    const limit = Math.min(Math.max(1, filters.limit ?? 50), 200);

    const where: any = {};
    if (actorId)    where.actorId    = actorId;
    if (action)     where.action     = { contains: action, mode: 'insensitive' };
    if (targetType) where.targetType = targetType;
    if (targetId)   where.targetId   = targetId;
    if (from || to) where.createdAt  = {
      ...(from ? { gte: from } : {}),
      ...(to   ? { lte: to }  : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  },
};
