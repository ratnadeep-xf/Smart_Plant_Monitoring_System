/*
  Warnings:

  - The primary key for the `PlantData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `plant_id` on the `PlantData` table. All the data in the column will be lost.
  - The required column `id` was added to the `PlantData` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `PlantType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Detection" ADD COLUMN     "plantDataId" TEXT;

-- AlterTable
ALTER TABLE "PlantData" DROP CONSTRAINT "PlantData_pkey",
DROP COLUMN "plant_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "PlantData_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PlantType" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT,
    "soilPct" DOUBLE PRECISION,
    "temperatureC" DOUBLE PRECISION,
    "humidityPct" DOUBLE PRECISION,
    "lux" DOUBLE PRECISION,
    "imageId" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reading_timestamp_idx" ON "Reading"("timestamp");

-- CreateIndex
CREATE INDEX "Reading_deviceId_idx" ON "Reading"("deviceId");

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_plantDataId_fkey" FOREIGN KEY ("plantDataId") REFERENCES "PlantData"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
