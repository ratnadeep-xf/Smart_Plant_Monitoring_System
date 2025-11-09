/*
  Warnings:

  - You are about to drop the column `pest_presence` on the `PlantData` table. All the data in the column will be lost.
  - You are about to drop the column `pest_severity` on the `PlantData` table. All the data in the column will be lost.
  - You are about to drop the `LabelMapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LabelMapping" DROP CONSTRAINT "LabelMapping_plantDataId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LabelMapping" DROP CONSTRAINT "LabelMapping_plantTypeId_fkey";

-- AlterTable
ALTER TABLE "PlantData" DROP COLUMN "pest_presence",
DROP COLUMN "pest_severity";

-- DropTable
DROP TABLE "public"."LabelMapping";
