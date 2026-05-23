/*
  Warnings:

  - The primary key for the `item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `item` table. All the data in the column will be lost.
  - Added the required column `marketName` to the `item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "item" DROP CONSTRAINT "item_pkey",
DROP COLUMN "name",
ADD COLUMN     "marketName" TEXT NOT NULL,
ADD CONSTRAINT "item_pkey" PRIMARY KEY ("marketName");
