-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "bytes" INTEGER,
ADD COLUMN     "folder" TEXT,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "secure_url" TEXT,
ADD COLUMN     "width" INTEGER,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InferenceCache" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InferenceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelMapping" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "normalized" TEXT,
    "plantTypeId" TEXT,
    "plantDataId" TEXT,
    "minConfidence" DOUBLE PRECISION DEFAULT 0.5,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InferenceCache_imageId_key" ON "InferenceCache"("imageId");

-- CreateIndex
CREATE INDEX "InferenceCache_provider_createdAt_idx" ON "InferenceCache"("provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabelMapping_label_key" ON "LabelMapping"("label");

-- CreateIndex
CREATE INDEX "LabelMapping_label_idx" ON "LabelMapping"("label");

-- CreateIndex
CREATE INDEX "Detection_label_idx" ON "Detection"("label");

-- CreateIndex
CREATE INDEX "Detection_createdAt_idx" ON "Detection"("createdAt");

-- CreateIndex
CREATE INDEX "Image_timestamp_idx" ON "Image"("timestamp");

-- CreateIndex
CREATE INDEX "Image_public_id_idx" ON "Image"("public_id");

-- AddForeignKey
ALTER TABLE "InferenceCache" ADD CONSTRAINT "InferenceCache_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelMapping" ADD CONSTRAINT "LabelMapping_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelMapping" ADD CONSTRAINT "LabelMapping_plantDataId_fkey" FOREIGN KEY ("plantDataId") REFERENCES "PlantData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
