// app/api/image/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

/**
 * GET /api/image/:id
 * Get image details including AI detection results
 * Used by Pi to check if AI processing is complete
 */
export async function GET(request, { params }) {
  try {
    const imageId = parseInt(params.id);

    if (isNaN(imageId)) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Invalid image ID',
      }, { status: 400 });
    }

    // Get image with detections
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        detections: {
          include: {
            plantType: true,
            plantData: true,
          },
        },
        inferenceCache: true,
      },
    });

    if (!image) {
      return NextResponse.json({
        error: 'Not Found',
        message: 'Image not found',
      }, { status: 404 });
    }

    // Check if AI processing is complete
    const isProcessed = !!image.inferenceCache;
    const hasDetections = image.detections.length > 0;

    // Find dominant detection
    let dominantDetection = null;
    if (hasDetections) {
      dominantDetection = image.detections.reduce((max, det) => 
        det.confidence > (max?.confidence || 0) ? det : max
      , null);
    }

    const response = {
      success: true,
      data: {
        image: {
          id: image.id,
          url: image.secureUrl,
          publicId: image.publicId,
          width: image.width,
          height: image.height,
          timestamp: image.timestamp,
        },
        processing: !isProcessed,
        detections: image.detections.map(d => ({
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

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
