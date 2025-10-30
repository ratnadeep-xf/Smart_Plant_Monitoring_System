# Quick Start Guide - Smart Plant Monitoring System Backend

## ✅ Completed Implementation

## 📁 Project Status

### All API Routes Created (10 endpoints):
1. ✅ `POST /api/telemetry` - Submit sensor readings
2. ✅ `POST /api/image` - Upload image with YOLO detection
3. ✅ `GET /api/latest` - Get latest sensor + image data
4. ✅ `GET /api/history` - Query historical readings
5. ✅ `GET /api/plantData/:id` - Get plant care details
6. ✅ `GET /api/plantTypes` - List all plant types
7. ✅ `POST /api/control/water` - Queue water command (rate limited)
8. ✅ `GET /api/commands` - Device command polling
9. ✅ `POST /api/commands/:id` - Acknowledge command
10. ✅ `GET /api/commands/:id` - Get command status

### All Services Converted to ES6:
- ✅ `lib/prisma.js` - Database client
- ✅ `services/cloudinaryService.js` - Image upload
- ✅ `services/yoloService.js` - YOLO detection
- ✅ `services/deviceService.js` - Command queue
- ✅ `services/labelMappingService.js` - Label to plant mapping
- ✅ `middlewares/authDevice.js` - Bearer token auth
- ✅ `middlewares/errorHandler.js` - Error responses
- ✅ `middlewares/rateLimiter.js` - Water rate limiting
- ✅ `utils/validators.js` - Zod schemas

### Database Setup:
- ✅ `scripts/seedData.js` - Seed plant types & mappings (ES6)
- ✅ `package.json` - Updated with `"type": "module"`
- ✅ `package.json` - Removed all TypeScript dependencies

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file (use `.env.example` as template):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_plant_db"
DEVICE_TOKEN_SECRET="your-secret-token"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
YOLO_API_URL="https://detect.roboflow.com/your-model/1"
YOLO_API_KEY="your-yolo-key"
```

### 3. Run Database Migrations
```bash
npm run db:migrate
```

### 4. Seed the Database
```bash
npm run db:seed
```
This creates:
- 4 plant types (Basil, Mint, Rosemary, Tomato)
- 4 plant data records (care instructions)
- 7 label mappings (YOLO labels → plants)

### 5. Start Development Server
```bash
npm run dev
```
Server runs at: `http://localhost:3000`

---

## 🧪 Test the API

### Test Telemetry Endpoint
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

### Test Image Upload
```bash
curl -X POST http://localhost:3000/api/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "device_id=rpi-001" \
  -F "image=@path/to/plant.jpg"
```

### Test Latest Data (No Auth Required)
```bash
curl http://localhost:3000/api/latest
```

### Test Water Control
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

## 📊 Rate Limiting

**Water Control Endpoint** (`/api/control/water`):
- **Max Duration:** 10 seconds
- **Cooldown:** 15 minutes between activations
- **Max Activations:** 2 per hour
- **Response on Limit:** 429 Too Many Requests with `nextAllowedAt`

---

## 🔐 Authentication

**Device Endpoints** (require Bearer token):
- POST /api/telemetry
- POST /api/image
- POST /api/control/water
- GET /api/commands
- POST /api/commands/:id
- GET /api/commands/:id

**Header Format:**
```
Authorization: Bearer YOUR_DEVICE_TOKEN_SECRET
```

**Frontend Endpoints** (no auth):
- GET /api/latest
- GET /api/history
- GET /api/plantData/:id
- GET /api/plantTypes

---

## 📦 Key Features Implemented

### Image Upload Flow
1. Client uploads image via multipart/form-data
2. Backend uploads to Cloudinary
3. Checks InferenceCache for existing YOLO results
4. If not cached, calls YOLO API for plant detection
5. Maps detected labels to PlantType/PlantData
6. Stores Detection records with plant info
7. Returns image URL, detections, and plant care data

### YOLO Integration
- Provider detection (Roboflow vs Ultralytics)
- Retry logic (3 attempts, exponential backoff)
- Response normalization
- Inference caching (avoid redundant API calls)
- Label mapping to plant database

### Command Queue
- Device polls `/api/commands` for pending actions
- Backend queues commands (e.g., water for 5 seconds)
- Device acknowledges with `/api/commands/:id`
- Status tracking: queued → started → completed/failed

---

## 🗄️ Database Schema

**Key Models:**
- `PlantType` - Plant species with sensor thresholds
- `PlantData` - Detailed care instructions
- `Reading` - Sensor telemetry from device
- `Image` - Cloudinary uploads with metadata
- `Detection` - YOLO results linked to plants
- `InferenceCache` - Cached YOLO responses
- `LabelMapping` - YOLO label → PlantType/PlantData

---

## 📖 Documentation

See `API_ROUTES_SUMMARY.md` for detailed API documentation including:
- All endpoint specifications
- Request/response examples
- Service function references
- Environment variable requirements

---