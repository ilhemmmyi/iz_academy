-- AlterTable: add updatedAt to LessonProgress (existing rows get current timestamp)
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
