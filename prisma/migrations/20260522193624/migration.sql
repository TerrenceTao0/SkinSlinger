/*
  Warnings:

  - The primary key for the `item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `docId` to the `item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "item" DROP CONSTRAINT "item_pkey",
ADD COLUMN     "docId" TEXT NOT NULL,
ADD CONSTRAINT "item_pkey" PRIMARY KEY ("docId");
