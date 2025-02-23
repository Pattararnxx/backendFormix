/*
  Warnings:

  - You are about to drop the column `labelChoice` on the `option` table. All the data in the column will be lost.
  - You are about to drop the column `limitAns` on the `option` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `option` DROP COLUMN `labelChoice`,
    DROP COLUMN `limitAns`,
    ADD COLUMN `text` VARCHAR(191) NOT NULL DEFAULT '';
