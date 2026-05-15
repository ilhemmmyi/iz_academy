-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'VALIDATED', 'NEEDS_IMPROVEMENT');

-- AlterTable: migrate existing string values to the new enum
ALTER TABLE "ProjectSubmission"
  ADD COLUMN "status_new" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "ProjectSubmission"
SET "status_new" = CASE
  WHEN "status" = 'validated'          THEN 'VALIDATED'::"SubmissionStatus"
  WHEN "status" = 'needs_improvement'  THEN 'NEEDS_IMPROVEMENT'::"SubmissionStatus"
  ELSE 'PENDING'::"SubmissionStatus"
END;

ALTER TABLE "ProjectSubmission" DROP COLUMN "status";
ALTER TABLE "ProjectSubmission" RENAME COLUMN "status_new" TO "status";
