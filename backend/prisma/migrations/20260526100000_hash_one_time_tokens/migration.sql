-- Migration: hash_one_time_tokens
-- Strategy: OPTION A — invalidate all existing plaintext tokens, force re-request.
--
-- Rationale: existing rows contain raw plaintext reset/verification tokens.
-- There is no safe way to hash them retroactively because we only have the
-- raw token stored — the hash of an unknown raw value cannot be computed.
-- Clearing all token fields is the correct OWASP-recommended approach.
--
-- Impact: any in-flight password-reset or email-verification links will
-- become invalid. Users simply need to request a new link. No accounts or
-- data are lost.

-- Step 1: invalidate every existing plaintext one-time token
UPDATE "User"
SET "resetPasswordToken"   = NULL,
    "resetPasswordExpires" = NULL,
    "emailVerificationToken"   = NULL,
    "emailVerificationExpires" = NULL;

-- Step 2: rename columns to reflect that only hashes are stored going forward
ALTER TABLE "User" RENAME COLUMN "resetPasswordToken"    TO "passwordResetTokenHash";
ALTER TABLE "User" RENAME COLUMN "emailVerificationToken" TO "emailVerificationTokenHash";
