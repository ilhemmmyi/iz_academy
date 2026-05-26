-- Migration: hash_refresh_tokens
-- Strategy: OPTION A — invalidate all existing sessions, force re-login.
--
-- Rationale: existing rows contain raw JWT refresh tokens (plain text).
-- There is no safe way to hash them retroactively because we would need the
-- raw token to compute the hash — and we only have the raw token stored.
-- Clearing all rows is the correct OWASP-recommended approach.
--
-- Impact: all currently logged-in users will be logged out on next page load.
-- They simply need to log in again. No data is lost.

-- Step 1: invalidate every existing refresh token (plain-text JWTs → gone)
DELETE FROM "RefreshToken";

-- Step 2: rename column token → tokenHash
ALTER TABLE "RefreshToken" RENAME COLUMN "token" TO "tokenHash";
