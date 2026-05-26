import crypto from 'crypto';

// ── One-time tokens (password reset, email verification) ─────────────────────

/**
 * Generate a cryptographically secure one-time token.
 * 32 random bytes → 64-character hex string (256 bits of entropy).
 * Used for password-reset and email-verification links.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Deterministic SHA-256 hash of any raw token string.
 * Only the hash is stored in the database; the raw token is sent to the
 * user by email and exists only in memory during the request lifecycle.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ── Refresh tokens ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure opaque refresh token.
 * 64 random bytes → 128-character hex string (512 bits of entropy).
 * This is NOT a JWT — it carries no payload and cannot be decoded.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * SHA-256 hash of a refresh token — same algorithm as hashToken(),
 * kept as a separate named export for call-site clarity.
 */
export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
