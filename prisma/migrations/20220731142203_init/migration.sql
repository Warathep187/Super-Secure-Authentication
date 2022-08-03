-- AlterTable
ALTER TABLE `otp` MODIFY `resetPasswordOtp` CHAR(6) NULL,
    MODIFY `resetPaswordExpiredAt` DATETIME(3) NULL;
