/*
  Warnings:

  - The `plantTypeId` column on the `Detection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `plantDataId` column on the `Detection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `plantTypeId` column on the `LabelMapping` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `plantDataId` column on the `LabelMapping` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PlantData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PlantData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PlantType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PlantType` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "public"."Detection" DROP CONSTRAINT "Detection_plantDataId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Detection" DROP CONSTRAINT "Detection_plantTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LabelMapping" DROP CONSTRAINT "LabelMapping_plantDataId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LabelMapping" DROP CONSTRAINT "LabelMapping_plantTypeId_fkey";

-- AlterTable
ALTER TABLE "Detection" DROP COLUMN "plantTypeId",
ADD COLUMN     "plantTypeId" INTEGER,
DROP COLUMN "plantDataId",
ADD COLUMN     "plantDataId" INTEGER;

-- AlterTable
ALTER TABLE "LabelMapping" DROP COLUMN "plantTypeId",
ADD COLUMN     "plantTypeId" INTEGER,
DROP COLUMN "plantDataId",
ADD COLUMN     "plantDataId" INTEGER;

-- AlterTable
ALTER TABLE "PlantData" DROP CONSTRAINT "PlantData_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PlantData_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PlantType" DROP CONSTRAINT "PlantType_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PlantType_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_plantDataId_fkey" FOREIGN KEY ("plantDataId") REFERENCES "PlantData"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelMapping" ADD CONSTRAINT "LabelMapping_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelMapping" ADD CONSTRAINT "LabelMapping_plantDataId_fkey" FOREIGN KEY ("plantDataId") REFERENCES "PlantData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
