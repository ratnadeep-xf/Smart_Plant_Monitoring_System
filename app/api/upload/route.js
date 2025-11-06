// app/api/upload/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';
import { uploadFromBuffer } from '../../../services/cloudinaryService.js';
import { inferByUrl } from '../../../services/huggingFaceService.js';
import { lookupMapping } from '../../../services/labelMappingService.js';

/**
 * POST /api/upload
 * Accept image uploads from dashboard users (no authentication required)
 * Uploads to Cloudinary, runs Hugging Face AI model detection, maps labels to plant types
 * 
 * Form data:
 * - image: file (required)
 */
export async function POST(request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image');

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
      tags: ['dashboard-upload', 'plant-detection'],
    });

    // Insert Image record
    const image = await prisma.image.create({
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
          ...cloudinaryResult.metadata,
          deviceId: 'dashboard-upload',
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
            thresholds: d.plantType.thresholds,
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
            pestPresence: d.plantData.pestPresence,
            pestSeverity: d.plantData.pestSeverity,
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
