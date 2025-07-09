/*
  Warnings:

  - The `role` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[user_id,prayer_id]` on the table `intercessions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "role",
ADD COLUMN     "role" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "intercessions_user_id_prayer_id_key" ON "intercessions"("user_id", "prayer_id");
