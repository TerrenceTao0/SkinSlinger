-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastInventoryRefresh" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00';
