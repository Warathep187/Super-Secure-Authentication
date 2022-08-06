/*
  Warnings:

  - You are about to drop the column `unblockSigninOtp` on the `blockings` table. All the data in the column will be lost.
  - You are about to drop the column `unblockSigninOtpExpiredAt` on the `blockings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `blockings` DROP COLUMN `unblockSigninOtp`,
    DROP COLUMN `unblockSigninOtpExpiredAt`;
