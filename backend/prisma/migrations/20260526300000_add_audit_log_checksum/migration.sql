-- Migration: add_audit_log_checksum
-- Adds a tamper-evidence HMAC-SHA256 checksum column to AuditLog.
--
-- The checksum is computed over the canonical record fields (id, actorId,
-- actorRole, action, targetType, targetId, ipAddress, userAgent,
-- correlationId, createdAt) using HMAC-SHA256 keyed with AUDIT_HMAC_SECRET.
-- Existing rows will have checksum = NULL (pre-migration records).
--
-- To verify a record:
--   AuditService.verifyChecksum(record) — returns true if checksum matches

ALTER TABLE "AuditLog" ADD COLUMN "checksum" TEXT;
