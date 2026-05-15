-- AlterTable: add mustChangePassword — safe default FALSE so existing users are unaffected
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE;
