-- AlterTable
ALTER TABLE "user" ADD COLUMN "twoFactorCode" TEXT;
ALTER TABLE "user" ADD COLUMN "twoFactorExpires" TIMESTAMP(3);
