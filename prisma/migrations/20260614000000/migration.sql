-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
