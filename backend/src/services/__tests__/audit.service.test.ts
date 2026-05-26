// jest.mock is hoisted — factories must be self-contained (no outer-scope variables).
jest.mock('../../config/prisma', () => ({
  prisma: {
    auditLog: {
      create:   jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count:    jest.fn().mockResolvedValue(0),
    },
  },
}));

jest.mock('../../config', () => ({
  config: { auditHmacSecret: 'test-secret-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
}));

import { AuditService, AuditAction } from '../audit.service';
import { prisma } from '../../config/prisma';

// Helpers for cast-free access to the mocks
const mockCreate   = prisma.auditLog.create   as jest.Mock;
const mockFindMany = prisma.auditLog.findMany as jest.Mock;
const mockCount    = prisma.auditLog.count    as jest.Mock;

// Flush the microtask queue so fire-and-forget promises settle before assertions.
const flush = () => new Promise(resolve => setImmediate(resolve));

beforeEach(() => jest.clearAllMocks());

// ── log() ─────────────────────────────────────────────────────────────────────

describe('AuditService.log()', () => {
  it('writes one record with the correct action', async () => {
    AuditService.log({ actorId: 'u1', action: AuditAction.AUTH_LOGIN });
    await flush();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'AUTH.LOGIN', actorId: 'u1' }) }),
    );
  });

  it('never throws when Prisma fails', () => {
    mockCreate.mockRejectedValueOnce(new Error('DB down'));
    expect(() => AuditService.log({ actorId: 'u1', action: AuditAction.AUTH_LOGIN })).not.toThrow();
  });

  it('returns synchronously — does not block', () => {
    const start = Date.now();
    AuditService.log({ actorId: 'u1', action: AuditAction.AUTH_LOGIN });
    expect(Date.now() - start).toBeLessThan(50);
  });
});

// ── Payload sanitization ──────────────────────────────────────────────────────

describe('payload sanitization', () => {
  async function capturePayload(payload: Record<string, unknown>) {
    AuditService.log({ actorId: 'u1', action: AuditAction.AUTH_LOGIN, payload });
    await flush();
    return mockCreate.mock.calls[0][0].data.payload as Record<string, unknown>;
  }

  it('redacts "password" fields', async () => {
    const p = await capturePayload({ email: 'a@b.com', password: 'secret' });
    expect(p.password).toBe('[REDACTED]');
    expect(p.email).toBe('a@b.com');
  });

  it('redacts "token" fields', async () => {
    const p = await capturePayload({ token: 'abc123' });
    expect(p.token).toBe('[REDACTED]');
  });

  it('redacts secret, hash, apiKey, credential, bearer, authorization', async () => {
    const p = await capturePayload({ secret: 'x', hash: 'y', apiKey: 'z', credential: 'c', bearer: 'b', authorization: 'a' });
    expect(p.secret).toBe('[REDACTED]');
    expect(p.hash).toBe('[REDACTED]');
    expect(p.apiKey).toBe('[REDACTED]');
    expect(p.credential).toBe('[REDACTED]');
    expect(p.bearer).toBe('[REDACTED]');
    expect(p.authorization).toBe('[REDACTED]');
  });

  it('redacts sensitive keys recursively', async () => {
    const p = await capturePayload({ user: { name: 'John', secret: 'hidden' } }) as any;
    expect(p.user.secret).toBe('[REDACTED]');
    expect(p.user.name).toBe('John');
  });

  it('preserves safe fields', async () => {
    const p = await capturePayload({ courseId: 'c1', role: 'ADMIN' });
    expect(p.courseId).toBe('c1');
    expect(p.role).toBe('ADMIN');
  });

  it('handles arrays — redacts key named "tokens"', async () => {
    const p = await capturePayload({ courseIds: ['a', 'b'], tokens: ['x'] }) as any;
    expect(p.courseIds).toEqual(['a', 'b']);
    expect(p.tokens).toBe('[REDACTED]');
  });
});

// ── query() ───────────────────────────────────────────────────────────────────

describe('AuditService.query()', () => {
  it('returns paginated results', async () => {
    mockFindMany.mockResolvedValueOnce([{ id: '1', action: 'AUTH.LOGIN', createdAt: new Date() }]);
    mockCount.mockResolvedValueOnce(1);

    const result = await AuditService.query({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.logs).toHaveLength(1);
  });

  it('uses page 1 when an invalid page is given', async () => {
    await AuditService.query({ page: -5 });
    expect(mockFindMany.mock.calls[0][0].skip).toBe(0); // (max(1,-5) - 1) * limit = 0
  });

  it('clamps limit to max 200', async () => {
    await AuditService.query({ limit: 9999 });
    expect(mockFindMany.mock.calls[0][0].take).toBe(200);
  });

  it('filters by actorId', async () => {
    await AuditService.query({ actorId: 'u42' });
    expect(mockFindMany.mock.calls[0][0].where.actorId).toBe('u42');
  });

  it('filters by action with case-insensitive contains', async () => {
    await AuditService.query({ action: 'auth' });
    expect(mockFindMany.mock.calls[0][0].where.action).toEqual({ contains: 'auth', mode: 'insensitive' });
  });

  it('filters by date range', async () => {
    const from = new Date('2026-01-01');
    const to   = new Date('2026-12-31');
    await AuditService.query({ from, to });
    expect(mockFindMany.mock.calls[0][0].where.createdAt).toEqual({ gte: from, lte: to });
  });
});

// ── Convenience wrappers ──────────────────────────────────────────────────────

describe('convenience wrappers', () => {
  it('auth() delegates to log()', async () => {
    AuditService.auth({ actorId: 'u1', action: AuditAction.AUTH_REGISTER });
    await flush();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('admin() delegates to log()', async () => {
    AuditService.admin({ actorId: 'u1', action: AuditAction.USER_DELETE });
    await flush();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('security() delegates to log() and emits a console.warn', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    AuditService.security({ actorId: 'u1', action: 'SECURITY.FORBIDDEN_ACCESS' });
    await flush();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('[Security]', expect.any(String));
    warnSpy.mockRestore();
  });
});

// ── HMAC checksum ─────────────────────────────────────────────────────────────

describe('HMAC checksum', () => {
  it('stores a non-null checksum when AUDIT_HMAC_SECRET is configured', async () => {
    AuditService.log({ actorId: 'u1', action: AuditAction.AUTH_LOGIN });
    await flush();
    const data = mockCreate.mock.calls[0][0].data;
    expect(typeof data.checksum).toBe('string');
    expect(data.checksum).toHaveLength(64); // 32-byte HMAC as hex
  });

  it('stores a deterministic id and createdAt in the same record', async () => {
    AuditService.log({ actorId: 'u1', action: AuditAction.AUTH_LOGIN });
    await flush();
    const data = mockCreate.mock.calls[0][0].data;
    expect(data.id).toBeTruthy();
    expect(data.createdAt).toBeInstanceOf(Date);
  });

  it('verifyChecksum returns true for an untampered record', async () => {
    AuditService.log({ actorId: 'u42', actorRole: 'STUDENT', action: AuditAction.AUTH_LOGIN, ip: '1.2.3.4' });
    await flush();
    const data = mockCreate.mock.calls[0][0].data;
    // Build a record object that mirrors what would be read back from the DB
    const record = {
      id:            data.id,
      correlationId: data.correlationId ?? null,
      actorId:       data.actorId,
      actorRole:     data.actorRole ?? null,
      action:        data.action,
      targetType:    data.targetType ?? null,
      targetId:      data.targetId ?? null,
      ipAddress:     data.ipAddress ?? null,
      userAgent:     data.userAgent ?? null,
      createdAt:     data.createdAt,
      checksum:      data.checksum,
    };
    expect(AuditService.verifyChecksum(record)).toBe(true);
  });

  it('verifyChecksum returns false when a field is tampered', async () => {
    AuditService.log({ actorId: 'u42', action: AuditAction.AUTH_LOGIN });
    await flush();
    const data = mockCreate.mock.calls[0][0].data;
    const tampered = {
      id: data.id, correlationId: null, actorId: 'ATTACKER', actorRole: null,
      action: data.action, targetType: null, targetId: null,
      ipAddress: null, userAgent: null, createdAt: data.createdAt, checksum: data.checksum,
    };
    expect(AuditService.verifyChecksum(tampered)).toBe(false);
  });

  it('verifyChecksum returns null when checksum is null', () => {
    const record = {
      id: 'x', correlationId: null, actorId: null, actorRole: null, action: 'AUTH.LOGIN',
      targetType: null, targetId: null, ipAddress: null, userAgent: null,
      createdAt: new Date(), checksum: null,
    };
    expect(AuditService.verifyChecksum(record)).toBeNull();
  });
});
