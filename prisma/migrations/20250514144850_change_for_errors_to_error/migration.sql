/*
  Warnings:

  - You are about to drop the column `errors` on the `Otp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "errors",
ADD COLUMN     "error" SMALLINT NOT NULL DEFAULT 0;
