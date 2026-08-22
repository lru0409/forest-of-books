-- AlterTable
ALTER TABLE "LibraryEntry" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: entries created before this migration were implicitly public,
-- so keep them visible. Only newly created entries default to private.
UPDATE "LibraryEntry" SET "isPublic" = true;
