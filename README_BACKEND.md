# Smart Adaptive Plant Care - Backend API

Cloud-connected Next.js backend for the Smart Plant Monitoring System with PostgreSQL, Cloudinary image storage, and YOLO plant detection.

## Features

- ✅ Accept telemetry and images from Raspberry Pi devices
- ✅ Upload images to Cloudinary with automatic metadata persistence
- ✅ YOLO inference API integration with response caching
- ✅ Intelligent label mapping to plant types and care data
- ✅ Rate-limited manual watering control
- ✅ Command queue system for device polling
- ✅ Device token authentication
- ✅ Comprehensive error handling and logging

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Cloudinary account
- YOLO detection API (Roboflow or Ultralytics)

## Installation

1. **Clone and install dependencies:**

```bash
npm install
# or
yarn install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `YOLO_PROVIDER_URL`, `YOLO_API_KEY`
- `DEVICE_TOKEN_SECRET` - Secret token for device authentication

3. **Run database migrations:**

```bash
npm run db:migrate
# or
npx prisma migrate dev --name init
```

4. **Generate Prisma Client:**

```bash
npm run prisma:generate
```

5. **Seed the database with plant data:**

```bash
npm run db:seed
```

## Running the Application

### Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Device Endpoints (Require Authorization Header)

#### POST `/api/telemetry`
Accept sensor readings from Raspberry Pi.

**Headers:**
```
Authorization: Bearer <DEVICE_TOKEN_SECRET>
```

**Request Body:**
```json
{
  "device_id": "pi-001",
  "timestamp": "2025-10-30T12:00:00Z",
  "soil_pct": 45.5,
  "temperature_c": 22.3,
  "humidity_pct": 60.2,
  "lux": 750.0,
  "image_id": "uuid-of-associated-image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reading": {
      "id": "uuid",
      "timestamp": "2025-10-30T12:00:00Z",
      "deviceId": "pi-001"
    },
    "message": "Telemetry received successfully"
  }
}
```

#### POST `/api/image`
Upload plant image for YOLO detection.

**Headers:**
```
Authorization: Bearer <DEVICE_TOKEN_SECRET>
Content-Type: multipart/form-data
```

**Form Data:**
- `device_id`: string
- `timestamp`: string (ISO 8601)
- `image_file`: file (JPEG/PNG, max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "image": {
      "id": "uuid",
      "publicId": "smart-plant-care/device-001/2025/10/image_123",
      "secureUrl": "https://res.cloudinary.com/...",
      "width": 1920,
      "height": 1080
    },
    "detections": [
      {
        "id": "uuid",
        "label": "basil",
        "confidence": 0.92,
        "dominant": true,
        "plantTypeId": "uuid",
        "plantDataId": "uuid"
      }
    ],
    "thresholds": {
      "soil_min": 40,
      "soil_max": 60,
      "temp_min": 18,
      "temp_max": 30
    }
  }
}
```

### Public Endpoints

#### GET `/api/latest`
Get the latest sensor reading, image, and detection.

**Response:**
```json
{
  "success": true,
  "data": {
    "reading": {
      "id": "uuid",
      "timestamp": "2025-10-30T12:00:00Z",
      "soilPct": 45.5,
      "temperatureC": 22.3,
      "humidityPct": 60.2,
      "lux": 750.0
    },
    "image": {
      "id": "uuid",
      "secureUrl": "https://res.cloudinary.com/...",
      "timestamp": "2025-10-30T11:50:00Z"
    },
    "detection": {
      "label": "basil",
      "confidence": 0.92,
      "plantType": {
        "name": "Basil",
        "thresholds": {...}
      }
    }
  }
}
```

#### GET `/api/history`
Get historical sensor readings.

**Query Parameters:**
- `sensor`: 'soil' | 'temperature' | 'humidity' | 'light' | 'all' (default: 'all')
- `from`: ISO 8601 timestamp (optional)
- `to`: ISO 8601 timestamp (optional)
- `agg`: 'raw' | 'hourly' (default: 'raw')
- `limit`: number (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": {
    "readings": [
      {
        "timestamp": "2025-10-30T12:00:00Z",
        "soilPct": 45.5,
        "temperatureC": 22.3
      }
    ],
    "count": 100
  }
}
```

#### GET `/api/plantTypes`
Get all plant types with thresholds.

#### GET `/api/plantData/:id`
Get detailed plant care data by ID.

### Control Endpoints

#### POST `/api/control/water`
Trigger manual watering (rate-limited).

**Request Body:**
```json
{
  "device_id": "pi-001",
  "duration_seconds": 5
}
```

**Rate Limits:**
- Max duration: 10 seconds
- Cooldown: 15 minutes between activations
- Max activations: 2 per hour

**Response:**
```json
{
  "success": true,
  "data": {
    "commandId": "uuid",
    "status": "queued",
    "nextAllowedAt": "2025-10-30T12:15:00Z",
    "remainingActivations": 1
  }
}
```

**Error Response (Rate Limited):**
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Cooldown period active. Next allowed at...",
  "nextAllowedAt": "2025-10-30T12:15:00Z",
  "remainingActivations": 0
}
```

### Device Command Queue

#### GET `/api/commands?device_id=pi-001`
Device polls for queued commands.

**Headers:**
```
Authorization: Bearer <DEVICE_TOKEN_SECRET>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "commands": [
      {
        "id": "uuid",
        "command": "water",
        "params": { "duration_seconds": 5 },
        "createdAt": "2025-10-30T12:00:00Z"
      }
    ]
  }
}
```

#### POST `/api/commands/:id`
Device acknowledges command execution.

**Headers:**
```
Authorization: Bearer <DEVICE_TOKEN_SECRET>
```

**Request Body:**
```json
{
  "status": "completed",
  "timestamp": "2025-10-30T12:01:00Z",
  "result": {
    "duration_actual": 5.2,
    "success": true
  }
}
```

## Example cURL Commands

### Post Telemetry
```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Authorization: Bearer your-device-token" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "pi-001",
    "soil_pct": 45.5,
    "temperature_c": 22.3,
    "humidity_pct": 60.2,
    "lux": 750.0
  }'
```

### Upload Image
```bash
curl -X POST http://localhost:3000/api/image \
  -H "Authorization: Bearer your-device-token" \
  -F "device_id=pi-001" \
  -F "timestamp=2025-10-30T12:00:00Z" \
  -F "image_file=@/path/to/plant.jpg"
```

### Get Latest Data
```bash
curl http://localhost:3000/api/latest
```

### Trigger Manual Watering
```bash
curl -X POST http://localhost:3000/api/control/water \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "pi-001",
    "duration_seconds": 5
  }'
```

## Database Schema

The Prisma schema includes the following models:

- **PlantType** - Plant species with threshold ranges
- **PlantData** - Detailed care instructions per plant
- **Image** - Cloudinary-stored images with metadata
- **Detection** - YOLO detection results linked to images
- **Reading** - Sensor telemetry readings
- **InferenceCache** - Cached YOLO API responses
- **LabelMapping** - Maps YOLO labels to PlantType/PlantData

See `prisma/schema.prisma` for the complete schema.

## Architecture

### Services
- **cloudinaryService** - Image upload/management
- **yoloService** - YOLO API integration with retries
- **labelMappingService** - Map detections to plant data
- **deviceService** - Command queue management

### Middlewares
- **authDevice** - Device token authentication
- **rateLimiter** - Rate limiting for water control
- **errorHandler** - Standardized error responses

### Flow: Image Upload → YOLO Detection

1. Device uploads image via `/api/image`
2. Image buffer uploaded to Cloudinary
3. Image metadata saved to PostgreSQL
4. Check InferenceCache for existing results
5. If not cached, call YOLO API with Cloudinary URL
6. Cache YOLO response, parse detections
7. Map labels to PlantType/PlantData via LabelMapping
8. Return detections and thresholds to device

## Testing

Run tests with Jest:

```bash
npm test
```

Tests include:
- API endpoint validation
- Rate limiter logic
- YOLO response normalization
- Error handling

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production DATABASE_URL
3. Run migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm start`

### Recommendations for Production

- Use Redis for rate limiting instead of in-memory storage
- Add Command model to Prisma schema for persistent queue
- Configure Cloudinary transformations for optimized images
- Set up monitoring and alerting (Sentry, DataDog)
- Enable CORS for specific origins
- Add request logging with Pino
- Implement JWT for more secure device auth

## Troubleshooting

### Cloudinary Upload Fails
- Verify CLOUDINARY_* credentials in .env
- Check file size (max 10MB)
- Ensure file type is JPEG/PNG

### YOLO API Timeout
- Check YOLO_PROVIDER_URL is correct
- Verify YOLO_API_KEY is valid
- Ensure image URL is publicly accessible

### Database Connection Issues
- Verify DATABASE_URL format
- Ensure PostgreSQL is running
- Run `npx prisma generate` after schema changes

### Rate Limit Not Working
- Check system time synchronization
- For multi-instance deployments, implement Redis-based rate limiting

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
