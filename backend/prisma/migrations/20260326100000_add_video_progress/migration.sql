-- AlterTable: add video progress tracking columns to LessonProgress
ALTER TABLE "LessonProgress" ADD COLUMN "watchedSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "LessonProgress" ADD COLUMN "durationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0;
