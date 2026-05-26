import crypto from 'crypto';

/**
 * Generate a cryptographically secure opaque refresh token.
 * 64 random bytes → 128-character hex string (512 bits of entropy).
 * This is NOT a JWT — it carries no payload and cannot be decoded.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Deterministic SHA-256 hash of a raw refresh token.
 * Only the hash is stored in the database; the raw token lives only in
 * the HTTP cookie and in memory during the request lifecycle.
 */
export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
