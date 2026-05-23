/*
  Warnings:

  - The primary key for the `item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `item` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "item_name_key";

-- AlterTable
ALTER TABLE "item" DROP CONSTRAINT "item_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "item_pkey" PRIMARY KEY ("name");
