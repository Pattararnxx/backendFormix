/*
  Warnings:

  - You are about to drop the column `title` on the `Question` table. All the data in the column will be lost.
  - The values [SHORT_ANSWER,MULTIPLE_CHOICE,CHECKBOX,DROPDOWN,PARAGRAPH] on the enum `Question_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - Added the required column `limitForm` to the `Form` table without a default value. This is not possible if the table is not empty.
  - Added the required column `limit` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_formID_fkey`;

-- DropForeignKey
ALTER TABLE `Response` DROP FOREIGN KEY `Response_formID_fkey`;

-- DropIndex
DROP INDEX `Question_formID_fkey` ON `Question`;

-- DropIndex
DROP INDEX `Response_formID_fkey` ON `Response`;

-- AlterTable
ALTER TABLE `Form` ADD COLUMN `limitForm` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Question` DROP COLUMN `title`,
    ADD COLUMN `limit` INTEGER NOT NULL,
    ADD COLUMN `question` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('text', 'check', 'number', 'dropdown', 'radio') NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `email` VARCHAR(191) NOT NULL,
    MODIFY `name` VARCHAR(191) NOT NULL DEFAULT 'Username',
    MODIFY `password` VARCHAR(191) NOT NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `Form` ADD CONSTRAINT `Form_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_formID_fkey` FOREIGN KEY (`formID`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_formID_fkey` FOREIGN KEY (`formID`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `email` TO `User_email_key`;
