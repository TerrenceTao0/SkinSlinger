-- AlterTable
ALTER TABLE "user" ADD COLUMN     "notificationEmail" TEXT,
ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "emailCode" TEXT,
ADD COLUMN     "emailCodeExpires" TIMESTAMP(3);
