/*
  Warnings:

  - You are about to drop the column `resetPaswordExpiredAt` on the `otps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `otps` DROP COLUMN `resetPaswordExpiredAt`,
    ADD COLUMN `resetPasswordExpiredAt` DATETIME(3) NULL;
