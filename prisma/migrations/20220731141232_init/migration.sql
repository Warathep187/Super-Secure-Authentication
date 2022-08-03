-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `authenticationType` VARCHAR(4) NOT NULL,
    `email` VARCHAR(191) NULL,
    `tel` VARCHAR(191) NULL,
    `password` VARCHAR(255) NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `passwordUpdateVersion` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_tel_key`(`tel`),
    INDEX `User_email_tel_idx`(`email`, `tel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Otp` (
    `userId` VARCHAR(191) NOT NULL,
    `signupOtp` CHAR(6) NOT NULL,
    `signupExpiredAt` DATETIME(3) NOT NULL,
    `resetPasswordOtp` CHAR(6) NOT NULL,
    `resetPaswordExpiredAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Otp_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blocking` (
    `userId` VARCHAR(191) NOT NULL,
    `unblockSigninOtp` CHAR(6) NOT NULL,
    `unblockSigninOtpExpiredAt` DATETIME(3) NOT NULL,
    `enteredWrongPasswordTime` INTEGER NOT NULL DEFAULT 0,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `blockedUntil` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Blocking_userId_key`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Otp` ADD CONSTRAINT `Otp_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blocking` ADD CONSTRAINT `Blocking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
