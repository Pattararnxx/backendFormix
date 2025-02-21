/*
  Warnings:

  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `form` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `option` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `response` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `form` DROP FOREIGN KEY `Form_userID_fkey`;

-- DropForeignKey
ALTER TABLE `option` DROP FOREIGN KEY `Option_questionID_fkey`;

-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_formID_fkey`;

-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_formID_fkey`;

-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_userID_fkey`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    MODIFY `name` VARCHAR(191) NULL DEFAULT 'Username';

-- DropTable
DROP TABLE `form`;

-- DropTable
DROP TABLE `option`;

-- DropTable
DROP TABLE `question`;

-- DropTable
DROP TABLE `response`;
