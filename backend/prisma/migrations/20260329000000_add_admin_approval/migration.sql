-- Add admin approval fields to ProjectSubmission
-- These allow an admin to give final authorization before the certificate is generated.

ALTER TABLE "ProjectSubmission"
  ADD COLUMN "adminApproved"     BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN "adminApprovedAt"   TIMESTAMP(3),
  ADD COLUMN "adminApprovedById" TEXT;

-- Index for efficient admin dashboard queries (filter by approval status)
CREATE INDEX "ProjectSubmission_adminApproved_idx"
  ON "ProjectSubmission" ("adminApproved");
