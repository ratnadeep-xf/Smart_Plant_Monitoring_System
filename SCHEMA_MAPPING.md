# Schema Field Mapping Reference

This document maps the Prisma schema field names to their usage in API routes and services.

## Image Model

### Prisma Schema Fields:
```prisma
model Image {
  id         String      @id @default(uuid())
  publicId   String?     @map("public_id")    // Cloudinary public_id
  secureUrl  String?     @map("secure_url")   // HTTPS URL from Cloudinary
  imageUrl   String?                          // legacy field
  folder     String?
  width      Int?
  height     Int?
  format     String?
  bytes      Int?
  timestamp  DateTime    @default(now())
  metadata   Json?       // Store deviceId here: {deviceId: "..."}
}
```

### API Usage:
```javascript
// Creating Image
await prisma.image.create({
  data: {
    publicId: cloudinaryResult.publicId,
    secureUrl: cloudinaryResult.secureUrl,
    imageUrl: cloudinaryResult.secureUrl,
    timestamp: new Date(),
    width: cloudinaryResult.width,
    height: cloudinaryResult.height,
    format: cloudinaryResult.format,
    bytes: cloudinaryResult.bytes,
    folder: cloudinaryResult.folder,
    metadata: {
      deviceId: 'rpi-001',
      // other metadata
    },
  },
});

// Response format
{
  id: image.id,
  url: image.secureUrl,
  publicId: image.publicId,
  width: image.width,
  height: image.height,
  timestamp: image.timestamp,
}
```

---

## PlantType Model

### Prisma Schema Fields:
```prisma
model PlantType {
  id         String    @id @default(uuid())
  name       String    @unique
  thresholds Json      // All thresholds stored as JSON
  notes      String?
}
```

### Thresholds JSON Structure:
```javascript
{
  soil_min: 50,
  soil_max: 70,
  temp_min: 18,
  temp_max: 28,
  humidity_min: 40,
  humidity_max: 60,
  light_min: 300,
  light_max: 800,
}
```

### API Usage:
```javascript
// Creating PlantType
await prisma.plantType.create({
  data: {
    name: 'Basil',
    thresholds: {
      soil_min: 50,
      soil_max: 70,
      temp_min: 18,
      temp_max: 28,
      humidity_min: 40,
      humidity_max: 60,
      light_min: 300,
      light_max: 800,
    },
    notes: 'Aromatic herb',
  },
});

// Response format
{
  id: plantType.id,
  name: plantType.name,
  thresholds: plantType.thresholds, // Full JSON object
}
```

---

## PlantData Model

### Prisma Schema Fields:
```prisma
model PlantData {
  id                       String   @id @default(uuid())
  commonName               String   @map("common_name")
  wateringAmountMl         Float?   @map("watering_amount_ml")
  wateringFrequencyDays    Int?     @map("watering_frequency_days")
  idealSunlightExposure    String?  @map("ideal_sunlight_exposure")
  idealRoomTemperatureC    Float?   @map("ideal_room_temperature_c")
  idealHumidityPercent     Float?   @map("ideal_humidity_percent")
  fertilizerType           String?  @map("fertilizer_type")
  idealFertilizerAmountMl  Float?   @map("ideal_fertilizer_amount_ml")
  pestPresence             Boolean? @map("pest_presence")
  pestSeverity             String?  @map("pest_severity")
  idealSoilMoisturePercent Float?   @map("ideal_soil_moisture_percent")
  idealSoilType            String?  @map("ideal_soil_type")
}
```

### API Usage:
```javascript
// Creating PlantData
await prisma.plantData.create({
  data: {
    commonName: 'Sweet Basil',
    wateringAmountMl: 250,
    wateringFrequencyDays: 1,
    idealSunlightExposure: 'Full sun (6-8 hours)',
    idealRoomTemperatureC: 23,
    idealHumidityPercent: 50,
    idealSoilMoisturePercent: 60,
    idealSoilType: 'Well-draining potting mix',
    fertilizerType: 'Balanced NPK (10-10-10)',
    idealFertilizerAmountMl: 50,
    pestPresence: false,
    pestSeverity: null,
  },
});

// Response format (all fields)
{
  id: plantData.id,
  commonName: plantData.commonName,
  wateringAmountMl: plantData.wateringAmountMl,
  wateringFrequencyDays: plantData.wateringFrequencyDays,
  idealSunlightExposure: plantData.idealSunlightExposure,
  idealRoomTemperatureC: plantData.idealRoomTemperatureC,
  idealHumidityPercent: plantData.idealHumidityPercent,
  idealSoilMoisturePercent: plantData.idealSoilMoisturePercent,
  idealSoilType: plantData.idealSoilType,
  fertilizerType: plantData.fertilizerType,
  idealFertilizerAmountMl: plantData.idealFertilizerAmountMl,
  pestPresence: plantData.pestPresence,
  pestSeverity: plantData.pestSeverity,
}
```

---

## Reading Model

### Prisma Schema Fields:
```prisma
model Reading {
  id           String   @id @default(uuid())
  timestamp    DateTime @default(now())
  deviceId     String?
  soilPct      Float?
  temperatureC Float?
  humidityPct  Float?
  lux          Float?
  imageId      String?
  rawPayload   Json?
}
```

### API Usage:
```javascript
// Creating Reading
await prisma.reading.create({
  data: {
    deviceId: 'rpi-001',
    timestamp: new Date(),
    soilPct: 65.5,
    temperatureC: 22.3,
    humidityPct: 55.2,
    lux: 450.0,
    imageId: imageId, // optional
    rawPayload: { /* original data */ },
  },
});

// Response format
{
  id: reading.id,
  timestamp: reading.timestamp,
  soilPct: reading.soilPct,
  temperatureC: reading.temperatureC,
  humidityPct: reading.humidityPct,
  lux: reading.lux,
  deviceId: reading.deviceId,
}
```

---

## Detection Model

### Prisma Schema Fields:
```prisma
model Detection {
  id           String     @id @default(uuid())
  imageId      String
  plantTypeId  String?
  plantDataId  String?
  label        String
  confidence   Float
  bbox         Json?
  dominant     Boolean    @default(false)
}
```

### API Usage:
```javascript
// Creating Detection
await prisma.detection.create({
  data: {
    imageId: image.id,
    label: 'basil',
    confidence: 0.85,
    bbox: { x: 100, y: 150, width: 200, height: 180 },
    plantTypeId: plantTypeId,
    plantDataId: plantDataId,
    dominant: false,
  },
  include: {
    plantType: true,
    plantData: true,
  },
});
```

---

## LabelMapping Model

### Prisma Schema Fields:
```prisma
model LabelMapping {
  id            String     @id @default(uuid())
  label         String     @unique
  normalized    String?
  plantTypeId   String?
  plantDataId   String?
  minConfidence Float?     @default(0.5)
  notes         String?
}
```

### API Usage:
```javascript
// Creating LabelMapping
await prisma.labelMapping.create({
  data: {
    label: 'basil',
    normalized: 'basil',
    plantTypeId: plantTypeId,
    plantDataId: plantDataId,
    minConfidence: 0.5,
    notes: 'Common basil detection',
  },
});

// Querying with case-insensitive label matching
await prisma.labelMapping.findFirst({
  where: {
    OR: [
      { label: { equals: 'Basil', mode: 'insensitive' } },
      { normalized: 'basil' },
    ],
  },
});
```

---

## InferenceCache Model

### Prisma Schema Fields:
```prisma
model InferenceCache {
  id           String   @id @default(uuid())
  imageId      String   @unique
  provider     String   // "roboflow" or "ultralytics"
  responseJson Json     // Raw YOLO response
}
```

### API Usage:
```javascript
// Creating InferenceCache
await prisma.inferenceCache.create({
  data: {
    imageId: image.id,
    provider: 'roboflow',
    responseJson: {
      predictions: [
        {
          class: 'basil',
          confidence: 0.85,
          x: 200,
          y: 250,
          width: 180,
          height: 160,
        },
      ],
    },
  },
});

// If YOLO returns error, store it in responseJson
responseJson: {
  error: 'API timeout',
  detections: [],
}
```

---

## Common Patterns

### 1. Image Upload Flow
```javascript
// 1. Upload to Cloudinary
const cloudinaryResult = await uploadFromBuffer(buffer, {
  folder: 'smart-plant-care',
  tags: [deviceId, 'plant-detection'],
});

// 2. Create Image record
const image = await prisma.image.create({
  data: {
    publicId: cloudinaryResult.publicId,
    secureUrl: cloudinaryResult.secureUrl,
    metadata: { deviceId },
    // ... other fields
  },
});

// 3. Check inference cache
let cache = await prisma.inferenceCache.findUnique({
  where: { imageId: image.id },
});

// 4. Run YOLO if not cached
if (!cache) {
  const yoloResult = await inferByUrl(cloudinaryResult.secureUrl);
  cache = await prisma.inferenceCache.create({
    data: {
      imageId: image.id,
      provider: yoloResult.provider,
      responseJson: yoloResult.rawResponse,
    },
  });
}

// 5. Create Detection records
for (const det of detections) {
  const mapping = await lookupMapping(det.label, det.confidence);
  await prisma.detection.create({
    data: {
      imageId: image.id,
      label: det.label,
      confidence: det.confidence,
      bbox: det.bbox,
      plantTypeId: mapping.plantTypeId,
      plantDataId: mapping.plantDataId,
    },
  });
}
```

### 2. Telemetry Submission
```javascript
const reading = await prisma.reading.create({
  data: {
    deviceId: data.device_id,
    timestamp: new Date(data.timestamp),
    soilPct: data.soil_pct,
    temperatureC: data.temperature_c,
    humidityPct: data.humidity_pct,
    lux: data.lux,
    rawPayload: data,
  },
});
```

### 3. Latest Data Retrieval
```javascript
const latestReading = await prisma.reading.findFirst({
  orderBy: { timestamp: 'desc' },
});

const latestImage = await prisma.image.findFirst({
  orderBy: { timestamp: 'desc' },
  include: {
    detections: {
      include: {
        plantType: true,
        plantData: true,
      },
      orderBy: { confidence: 'desc' },
      take: 1,
    },
  },
});
```

---

## Database Naming Conventions

- **Snake case in database:** `common_name`, `watering_amount_ml`, `soil_pct`
- **Camel case in Prisma/JS:** `commonName`, `wateringAmountMl`, `soilPct`
- **@map() directive:** Links camel case to snake case
- **JSON fields:** Store complex objects (thresholds, metadata, bbox, rawPayload)

---

## Quick Reference

| Model | Unique Constraint | Key Fields | JSON Fields |
|-------|------------------|------------|-------------|
| PlantType | name | name, thresholds | thresholds |
| PlantData | commonName | commonName, wateringAmountMl | - |
| Image | - | publicId, secureUrl | metadata |
| Reading | - | deviceId, timestamp, soilPct | rawPayload |
| Detection | - | imageId, label, confidence | bbox |
| LabelMapping | label | label, normalized, plantTypeId | - |
| InferenceCache | imageId | imageId, provider | responseJson |
