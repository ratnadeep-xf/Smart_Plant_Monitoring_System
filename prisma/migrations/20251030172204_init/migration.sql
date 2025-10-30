-- CreateTable
CREATE TABLE "PlantType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thresholds" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantData" (
    "plant_id" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "watering_amount_ml" DOUBLE PRECISION,
    "watering_frequency_days" INTEGER,
    "ideal_sunlight_exposure" TEXT,
    "ideal_room_temperature_c" DOUBLE PRECISION,
    "ideal_humidity_percent" DOUBLE PRECISION,
    "fertilizer_type" TEXT,
    "ideal_fertilizer_amount_ml" DOUBLE PRECISION,
    "pest_presence" BOOLEAN,
    "pest_severity" TEXT,
    "ideal_soil_moisture_percent" DOUBLE PRECISION,
    "ideal_soil_type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantData_pkey" PRIMARY KEY ("plant_id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "plantTypeId" TEXT,
    "label" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "bbox" JSONB,
    "dominant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantType_name_key" ON "PlantType"("name");

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
