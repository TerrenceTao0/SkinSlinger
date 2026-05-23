/*
  Warnings:

  - Added the required column `game` to the `inventory_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventory_item" ADD COLUMN "game" TEXT NOT NULL DEFAULT 'CS2';
ALTER TABLE "inventory_item" ALTER COLUMN "game" DROP DEFAULT;
