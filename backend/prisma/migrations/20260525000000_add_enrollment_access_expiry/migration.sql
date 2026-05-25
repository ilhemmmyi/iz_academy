-- Add time-limited access fields to Enrollment
ALTER TABLE "Enrollment" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN "accessExpiresAt" TIMESTAMP(3);
