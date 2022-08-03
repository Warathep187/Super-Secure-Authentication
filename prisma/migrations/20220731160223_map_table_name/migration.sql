/*
  Warnings:

  - You are about to drop the `blocking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `otp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `blocking` DROP FOREIGN KEY `Blocking_userId_fkey`;

-- DropForeignKey
ALTER TABLE `otp` DROP FOREIGN KEY `Otp_userId_fkey`;

-- DropTable
DROP TABLE `blocking`;

-- DropTable
DROP TABLE `otp`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `authenticationType` ENUM('EMAIL', 'TEL') NOT NULL DEFAULT 'EMAIL',
    `email` VARCHAR(191) NULL,
    `tel` VARCHAR(191) NULL,
    `password` VARCHAR(255) NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `passwordUpdateVersion` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_tel_key`(`tel`),
    INDEX `users_email_tel_idx`(`email`, `tel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otps` (
    `userId` VARCHAR(191) NOT NULL,
    `signupOtp` CHAR(6) NOT NULL,
    `signupExpiredAt` DATETIME(3) NOT NULL,
    `resetPasswordOtp` CHAR(6) NULL,
    `resetPaswordExpiredAt` DATETIME(3) NULL,

    UNIQUE INDEX `otps_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blockings` (
    `userId` VARCHAR(191) NOT NULL,
    `unblockSigninOtp` CHAR(6) NULL,
    `unblockSigninOtpExpiredAt` DATETIME(3) NULL,
    `enteredWrongPasswordTime` INTEGER NOT NULL DEFAULT 0,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `blockedUntil` DATETIME(3) NULL,

    UNIQUE INDEX `blockings_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `otps` ADD CONSTRAINT `otps_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blockings` ADD CONSTRAINT `blockings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
