/*
  Warnings:

  - You are about to drop the column `active` on the `form` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `form` DROP COLUMN `active`,
    ADD COLUMN `archive` BOOLEAN NULL DEFAULT false;
