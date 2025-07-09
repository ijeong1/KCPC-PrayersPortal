/*
  Warnings:

  - The `status` column on the `prayers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "prayers" DROP COLUMN "status",
ADD COLUMN     "status" "PrayerStatus" DEFAULT 'PENDING';
