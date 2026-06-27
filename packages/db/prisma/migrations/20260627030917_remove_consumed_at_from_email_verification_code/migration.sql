/*
  Warnings:

  - You are about to drop the column `consumedAt` on the `EmailVerificationCode` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EmailVerificationCode_email_expiresAt_consumedAt_idx";

-- AlterTable
ALTER TABLE "EmailVerificationCode" DROP COLUMN "consumedAt";

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_expiresAt_idx" ON "EmailVerificationCode"("email", "expiresAt");
