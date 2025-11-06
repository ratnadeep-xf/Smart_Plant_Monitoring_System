# API Routes Implementation Summary

## Authentication
All device endpoints require: `Authorization: Bearer <DEVICE_TOKEN_SECRET>`

---

## Device Endpoints (Require Authentication)

### POST /api/telemetry
**Purpose:** Submit sensor readings from Raspberry Pi  
**Body:**
```json
{
  "device_id": "string",
  "timestamp": "ISO 8601 string",
  "soil_moisture": "number",
  "temperature": "number",
  "humidity": "number",
  "light_level": "number"
}
```
**Response:** 201 Created with reading ID

---

### POST /api/image
**Purpose:** Upload plant image, run Hugging Face AI detection, map to plant types  
**Content-Type:** multipart/form-data  
**Fields:**
- `device_id`: string
- `timestamp`: ISO 8601 string
- `image`: file

**Flow:**
1. Upload to Cloudinary
2. Check InferenceCache
3. Run Hugging Face AI inference (if not cached)
4. Map labels to PlantType/PlantData
5. Store Detection records

**Response:** 201 Created with image metadata, detections array, plant info

---

### POST /api/control/water
**Purpose:** Queue watering command with rate limiting  
**Body:**
```json
{
  "device_id": "string",
  "duration": "number (max 10 seconds)"
}
```

**Rate Limits:**
- Max duration: 10 seconds
- Cooldown: 15 minutes
- Max activations: 2 per hour

**Response:** 
- 201 Created with commandId (if allowed)
- 429 Too Many Requests with nextAllowedAt (if rate limited)

---

### GET /api/commands?device_id=xxx
**Purpose:** Device polling for queued commands  
**Query Params:**
- `device_id`: string (required)

**Response:** Array of pending commands

---

### POST /api/commands/:id
**Purpose:** Acknowledge command execution  
**Body:**
```json
{
  "status": "started|completed|failed",
  "result": "object (optional)"
}
```
**Response:** Updated command object

---

### GET /api/commands/:id
**Purpose:** Get command status by ID  
**Response:** Command object with current status

---

## Frontend Endpoints (No Authentication)

### GET /api/latest
**Purpose:** Get latest sensor reading, image, and detection  
**Response:**
```json
{
  "success": true,
  "data": {
    "reading": {...},
    "image": {...},
    "detection": {
      "label": "string",
      "confidence": "number",
      "plantType": {...},
      "plantData": {...}
    }
  }
}
```

---

### GET /api/history
**Purpose:** Query historical sensor readings  
**Query Params:**
- `sensor`: soil|temperature|humidity|light (optional)
- `from`: ISO 8601 date (optional)
- `to`: ISO 8601 date (optional)
- `agg`: raw|hourly (default: raw)
- `limit`: number (default: 100, max: 1000)

**Response:** Array of readings (raw or aggregated hourly)

---

### GET /api/plantData/:id
**Purpose:** Get plant care details by plantDataId  
**Response:** PlantData object with watering info, sunlight needs

---

### GET /api/plantTypes
**Purpose:** Get all plant types with thresholds  
**Response:** Array of PlantType objects with soil/temp/humidity/light ranges

---

## Database Seeding

### npm run db:seed
**Script:** `scripts/seedData.js`  
**Creates:**
- PlantType records (Basil, Mint, Rosemary, Tomato)
- PlantData records (care instructions)
- LabelMapping records (AI model labels → PlantType/PlantData)

**Seeds:**
1. Basil (soilMin: 50, soilMax: 70, tempMin: 18, tempMax: 28)
2. Mint (soilMin: 60, soilMax: 80, tempMin: 15, tempMax: 25)
3. Rosemary (soilMin: 30, soilMax: 50, tempMin: 15, tempMax: 30)
4. Tomato (soilMin: 55, soilMax: 75, tempMin: 20, tempMax: 30)

---

## File Structure

```
app/api/
├── telemetry/route.js          # POST sensor readings
├── image/route.js              # POST image upload + AI detection
├── latest/route.js             # GET latest data
├── history/route.js            # GET historical data
├── plantData/[id]/route.js     # GET plant care details
├── plantTypes/route.js         # GET all plant types
├── control/
│   └── water/route.js          # POST water command (rate limited)
└── commands/
    ├── route.js                # GET queued commands
    └── [id]/route.js           # POST/GET command status
```

---

## Services (ES6 Modules)

### lib/prisma.js
- `export default prisma` - Singleton Prisma client
- `export async function disconnectPrisma()`

### services/cloudinaryService.js
- `export async function uploadFromBuffer(buffer, options)`
- `export async function deleteImage(publicId)`
- `export function buildUrl(publicId, transformations)`
- `export async function getImageDetails(publicId)`

### services/huggingFaceService.js
- `export async function inferByUrl(imageUrl)` - Hugging Face AI detection with retry

### services/deviceService.js
- `export async function queueCommand(command)`
- `export async function getQueuedCommands(deviceId)`
- `export async function updateCommandStatus(id, status, result)`
- `export async function getCommandById(id)`

### services/labelMappingService.js
- `export async function lookupMapping(label, confidence)`
- `export async function upsertMapping(mapping)`
- `export async function getAllMappings()`

### middlewares/rateLimiter.js
- `export function checkWaterRateLimit(deviceId)`
- `export function recordWaterEvent(deviceId, duration)`

### utils/validators.js
- `export const telemetrySchema` (Zod)
- `export const waterControlSchema` (Zod)
- `export function validateRequest(schema, data)`

---

## Environment Variables Required

```env
DATABASE_URL="postgresql://..."
DEVICE_TOKEN_SECRET="your-secret-token"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
HF_API_URL="https://api-inference.huggingface.co/models/username/model-name"
HF_API_TOKEN="hf_your_token_here"
HF_TIMEOUT_MS="30000"
```

---

## Next Steps

1. **Set up environment variables** in `.env` file
2. **Run database migration:** `npm run db:migrate`
3. **Seed the database:** `npm run db:seed`
4. **Start development server:** `npm run dev`
5. **Test endpoints** with Postman/curl using Bearer token

---

## Testing Device Endpoints

### Example: Send Telemetry
```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "rpi-001",
    "soil_moisture": 65,
    "temperature": 22.5,
    "humidity": 55,
    "light_level": 450
  }'
```

### Example: Upload Image
```bash
curl -X POST http://localhost:3000/api/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "device_id=rpi-001" \
  -F "image=@plant.jpg"
```

### Example: Queue Water Command
```bash
curl -X POST http://localhost:3000/api/control/water \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "rpi-001",
    "duration": 5
  }'
```

---

## All Routes Implemented ✅

- ✅ POST /api/telemetry
- ✅ POST /api/image
- ✅ GET /api/latest
- ✅ GET /api/history
- ✅ GET /api/plantData/:id
- ✅ GET /api/plantTypes
- ✅ POST /api/control/water
- ✅ GET /api/commands
- ✅ POST /api/commands/:id
- ✅ GET /api/commands/:id
- ✅ scripts/seedData.js
