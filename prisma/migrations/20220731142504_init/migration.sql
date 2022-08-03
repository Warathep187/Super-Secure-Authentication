-- AlterTable
ALTER TABLE `blocking` MODIFY `unblockSigninOtp` CHAR(6) NULL,
    MODIFY `unblockSigninOtpExpiredAt` DATETIME(3) NULL,
    MODIFY `blockedUntil` DATETIME(3) NULL;
