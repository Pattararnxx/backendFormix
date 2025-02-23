/*
  Warnings:

  - You are about to drop the column `text` on the `option` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `option` DROP COLUMN `text`,
    ADD COLUMN `labelChoice` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `limitAns` INTEGER NULL;
