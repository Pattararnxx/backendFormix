/*
  Warnings:

  - You are about to drop the column `userID` on the `response` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_userID_fkey`;

-- DropIndex
DROP INDEX `Response_userID_fkey` ON `response`;

-- AlterTable
ALTER TABLE `response` DROP COLUMN `userID`;
