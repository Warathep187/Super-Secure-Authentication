-- AlterTable
ALTER TABLE `otps` MODIFY `signupOtp` CHAR(6) NULL,
    MODIFY `signupExpiredAt` DATETIME(3) NULL;
