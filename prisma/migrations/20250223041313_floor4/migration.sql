-- CreateTable
CREATE TABLE `Option` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `text` VARCHAR(191) NOT NULL DEFAULT '',
    `questionID` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Option` ADD CONSTRAINT `Option_questionID_fkey` FOREIGN KEY (`questionID`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
