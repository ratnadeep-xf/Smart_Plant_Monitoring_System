// app/api/image/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';
import { uploadFromBuffer } from '../../../services/cloudinaryService.js';
import { inferByUrl } from '../../../services/huggingFaceService.js';
import { lookupMapping } from '../../../services/labelMappingService.js';
/**
 * POST /api/image
 * Accept image uploads from Raspberry Pi device
 * Uploads to Cloudinary, runs Hugging Face AI model detection, maps labels to plant types
 * 
 * Form data:
 * - device_id: string
 * - timestamp: string (ISO 8601)
 * - image: file
 * 
 * Requires: Authorization: Bearer <DEVICE_TOKEN_SECRET>
 */
export async function POST(request) {
  try {
    // Check device authentication
    const authHeader = request.headers.get('authorization');
    const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== DEVICE_TOKEN_SECRET) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid device token',
      }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const deviceId = formData.get('device_id') || 'default-device';
    const timestamp = formData.get('timestamp') ? new Date(formData.get('timestamp')) : new Date();

    if (!imageFile) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'No image file provided',
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    console.log('Uploading image to Cloudinary...');
    const cloudinaryResult = await uploadFromBuffer(buffer, {
      folder: 'smart-plant-care',
      tags: [deviceId, 'plant-detection'],
    });

    // Insert Image record
    const image = await prisma.image.create({
      data: {
        publicId: cloudinaryResult.publicId,
        secureUrl: cloudinaryResult.secureUrl,
        imageUrl: cloudinaryResult.secureUrl, // legacy field
        timestamp,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
        folder: cloudinaryResult.folder,
        metadata: {
          ...cloudinaryResult.metadata,
          deviceId, // store deviceId in metadata
        },
      },
    });

    console.log(`Image uploaded: ${image.id}`);

    // Check inference cache
    let inferenceCache = await prisma.inferenceCache.findUnique({
      where: { imageId: image.id },
    });

    let aiResult;
    if (!inferenceCache) {
      // Call Hugging Face AI model
      console.log('Running Hugging Face AI inference...');
      aiResult = await inferByUrl(cloudinaryResult.secureUrl);

      // Store in cache
      inferenceCache = await prisma.inferenceCache.create({
        data: {
          imageId: image.id,
          provider: aiResult.provider,
          responseJson: aiResult.error 
            ? { error: aiResult.error, detections: [] }
            : aiResult.rawResponse,
        },
      });
    } else {
      console.log('Using cached AI inference result');
      aiResult = {
        detections: [],
        provider: inferenceCache.provider,
        rawResponse: inferenceCache.responseJson,
      };

      // Parse detections from cached response
      const cachedData = inferenceCache.responseJson;
      
      // Handle array response (most common)
      if (Array.isArray(cachedData)) {
        aiResult.detections = cachedData.map(item => ({
          label: item.label || 'unknown',
          confidence: item.score || item.confidence || 0,
        }));
      }
      // Handle predictions array
      else if (cachedData?.predictions) {
        aiResult.detections = cachedData.predictions.map(p => ({
          label: p.label || p.class || 'unknown',
          confidence: p.score || p.confidence || 0,
        }));
      }
    }

    // Create Detection records
    const detections = [];
    let dominantDetection = null;
    let maxConfidence = 0;

    for (const det of aiResult.detections) {
      // Map label to plant type/data
      const mapping = await lookupMapping(det.label, det.confidence);

      const detection = await prisma.detection.create({
        data: {
          imageId: image.id,
          label: det.label,
          confidence: det.confidence,
          plantTypeId: mapping.plantTypeId,
          plantDataId: mapping.plantDataId,
        },
        include: {
          plantType: true,
          plantData: true,
        },
      });

      detections.push(detection);

      if (det.confidence > maxConfidence) {
        maxConfidence = det.confidence;
        dominantDetection = detection;
      }
    }

    // Prepare response
    const response = {
      success: true,
      data: {
        image: {
          id: image.id,
          url: cloudinaryResult.secureUrl,
          publicId: cloudinaryResult.publicId,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          timestamp: image.timestamp,
        },
        detections: detections.map(d => ({
          id: d.id,
          label: d.label,
          confidence: d.confidence,
          plantType: d.plantType ? {
            id: d.plantType.id,
            name: d.plantType.name,
            thresholds: d.plantType.thresholds, // JSON object with all thresholds
          } : null,
          plantData: d.plantData ? {
            id: d.plantData.id,
            commonName: d.plantData.commonName,
            wateringAmountMl: d.plantData.wateringAmountMl,
            wateringFrequencyDays: d.plantData.wateringFrequencyDays,
            idealSunlightExposure: d.plantData.idealSunlightExposure,
            idealRoomTemperatureC: d.plantData.idealRoomTemperatureC,
            idealHumidityPercent: d.plantData.idealHumidityPercent,
            idealSoilMoisturePercent: d.plantData.idealSoilMoisturePercent,
            idealSoilType: d.plantData.idealSoilType,
            fertilizerType: d.plantData.fertilizerType,
            idealFertilizerAmountMl: d.plantData.idealFertilizerAmountMl,
          } : null,
        })),
        dominant: dominantDetection ? {
          label: dominantDetection.label,
          confidence: dominantDetection.confidence,
          plantTypeId: dominantDetection.plantTypeId,
          plantDataId: dominantDetection.plantDataId,
        } : null,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
