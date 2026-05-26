-- Migration: add_audit_log
-- Creates an append-only AuditLog table for forensic traceability.
--
-- Security design:
--   • No updatedAt column — records are structurally immutable once inserted.
--   • The application layer exposes no update/delete API for this table.
--   • For production hardening, revoke UPDATE and DELETE from the app DB role:
--       REVOKE UPDATE, DELETE ON "AuditLog" FROM <your_app_db_user>;
--     (Uncomment and run once after migration if your DB user has those grants.)

CREATE TABLE "AuditLog" (
  "id"            TEXT NOT NULL,
  "correlationId" TEXT,
  "actorId"       TEXT,
  "actorRole"     TEXT,
  "action"        TEXT NOT NULL,
  "targetType"    TEXT,
  "targetId"      TEXT,
  "payload"       JSONB,
  "ipAddress"     TEXT,
  "userAgent"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_idx"              ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx"               ON "AuditLog"("action");
CREATE INDEX "AuditLog_targetType_targetId_idx"  ON "AuditLog"("targetType","targetId");
CREATE INDEX "AuditLog_createdAt_idx"            ON "AuditLog"("createdAt");
