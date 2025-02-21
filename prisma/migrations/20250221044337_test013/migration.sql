/*
  Warnings:

  - You are about to drop the column `createdAt` on the `form` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `form` DROP COLUMN `createdAt`,
    MODIFY `limitForm` INTEGER NULL;
