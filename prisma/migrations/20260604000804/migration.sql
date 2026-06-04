-- AlterTable
ALTER TABLE "user" ADD COLUMN     "inventoryCache" JSONB,
ADD COLUMN     "lastInventoryRefresh" TIMESTAMP(3);
