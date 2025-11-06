This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Smart Plant Monitoring System

An intelligent plant monitoring system that uses AI-powered plant detection via Hugging Face models to identify plants and provide tailored care recommendations.

## Features

- 🌱 **AI Plant Detection**: Uses Hugging Face hosted models for plant identification
- 📸 **Image Upload & Analysis**: Upload plant images for automatic detection and classification
- 💧 **Smart Watering Control**: Automated watering based on plant needs
- 📊 **Real-time Telemetry**: Monitor temperature, humidity, soil moisture, and light levels
- 📈 **Historical Data**: Track plant health over time
- 🎯 **Plant-Specific Care**: Customized thresholds and recommendations per plant type

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Cloudinary account for image storage
- Hugging Face account with a hosted AI model

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Your Cloudinary credentials
   - `HF_API_URL`: Your Hugging Face model API endpoint (e.g., `https://api-inference.huggingface.co/models/username/model-name`)
   - `HF_API_TOKEN`: Your Hugging Face API token
   - `DEVICE_TOKEN_SECRET`: Secret token for device authentication

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Open Prisma Studio to view data
npm run prisma:studio
```

### Run Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Hugging Face Model Setup

This system uses Hugging Face's Inference API to detect and classify plants. You can use:

1. **Object Detection Models**: For detecting plants with bounding boxes
   - Example: `facebook/detr-resnet-50`
   - Example: Custom trained models for plant detection

2. **Image Classification Models**: For classifying plant types
   - Example: `google/vit-base-patch16-224`
   - Example: Fine-tuned models for plant species classification

### Setting Up Your Model

1. **Option 1: Use an Existing Model**
   - Browse [Hugging Face Models](https://huggingface.co/models)
   - Find a plant detection/classification model
   - Copy the model URL to `HF_API_URL`

2. **Option 2: Deploy Your Own Model**
   - Train or fine-tune a model for plant detection
   - Upload to Hugging Face Hub
   - Enable Inference API on your model page
   - Use the API endpoint in `HF_API_URL`

3. **Get Your API Token**
   - Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - Create a new access token
   - Add it to `HF_API_TOKEN` in your `.env` file

### Supported Response Formats

The system automatically handles multiple Hugging Face response formats:
- Object detection with bounding boxes (`{label, score, box: {xmin, ymin, xmax, ymax}}`)
- Image classification (`{label, score}`)
- Custom prediction formats

## API Endpoints

- `POST /api/image` - Upload plant image for AI detection
- `GET /api/latest` - Get latest telemetry data
- `POST /api/telemetry` - Submit sensor readings
- `GET /api/history` - Get historical sensor data
- `POST /api/control/water` - Trigger watering
- See `API_ROUTES_SUMMARY.md` for complete API documentation

## Project Structure

```
app/
  ├── api/              # API routes
  ├── dashboard/        # Dashboard page
  └── plant-details/    # Plant details page
components/             # React components
services/
  ├── huggingFaceService.js  # Hugging Face AI integration
  ├── cloudinaryService.js    # Image storage
  └── labelMappingService.js  # Map AI labels to plant types
lib/
  ├── db.js            # Database utilities
  └── prisma.js        # Prisma client
prisma/
  └── schema.prisma    # Database schema
```

## Technologies Used

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: Hugging Face Inference API
- **Image Storage**: Cloudinary
- **Authentication**: Token-based device auth

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
