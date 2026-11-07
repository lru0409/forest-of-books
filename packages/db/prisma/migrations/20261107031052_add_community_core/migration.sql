-- AlterTable
ALTER TABLE "LibraryEntry" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryView" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "viewerKey" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_entryId_key" ON "Like"("userId", "entryId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_createdAt_id_idx" ON "Bookmark"("userId", "createdAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_entryId_key" ON "Bookmark"("userId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryView_entryId_viewerKey_day_key" ON "EntryView"("entryId", "viewerKey", "day");

-- CreateIndex
CREATE INDEX "LibraryEntry_isPublic_createdAt_id_idx" ON "LibraryEntry"("isPublic", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "LibraryEntry_bookId_isPublic_createdAt_id_idx" ON "LibraryEntry"("bookId", "isPublic", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "LibraryEntry_userId_isPublic_createdAt_id_idx" ON "LibraryEntry"("userId", "isPublic", "createdAt" DESC, "id");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LibraryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LibraryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LibraryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
