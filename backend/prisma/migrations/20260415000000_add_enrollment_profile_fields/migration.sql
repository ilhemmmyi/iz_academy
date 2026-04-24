-- Add profile fields to User (collected at enrollment time, set on approval)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "educationLevel" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentStatus" TEXT;

-- Add extra-info fields to Enrollment (stored until approval)
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "educationLevel" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "studentStatus" TEXT;
