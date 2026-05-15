-- AlterTable: add durationSeconds to Lesson with a safe default of 0
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "durationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0;
