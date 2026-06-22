-- DropColumn: formation, duree, dateDebut were admin-only free-text notes
-- with no business logic depending on them (real course assignment goes
-- through Course.teacherId, not these fields).
ALTER TABLE "User" DROP COLUMN IF EXISTS "formation";
ALTER TABLE "User" DROP COLUMN IF EXISTS "duree";
ALTER TABLE "User" DROP COLUMN IF EXISTS "dateDebut";
