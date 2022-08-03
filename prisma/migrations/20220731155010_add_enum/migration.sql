/*
  Warnings:

  - You are about to alter the column `authenticationType` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(5)` to `Enum("User_authenticationType")`.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `authenticationType` ENUM('EMAIL', 'TEL') NOT NULL DEFAULT 'EMAIL';
