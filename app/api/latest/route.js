// app/api/latest/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

/**
 * GET /api/latest
 * Returns the latest reading, image, and detection with plant information
 * No authentication required - frontend endpoint
 */
export async function GET(request) {
  try {
    // Get latest reading
    const latestReading = await prisma.reading.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    // Get latest image with detections
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

    // Prepare response
    const response = {
      success: true,
      data: {
        reading: latestReading ? {
          id: latestReading.id,
          timestamp: latestReading.timestamp,
          soilPct: latestReading.soilPct,
          temperatureC: latestReading.temperatureC,
          humidityPct: latestReading.humidityPct,
          lux: latestReading.lux,
          deviceId: latestReading.deviceId,
        } : null,
        image: latestImage ? {
          id: latestImage.id,
          url: latestImage.secureUrl,
          publicId: latestImage.publicId,
          timestamp: latestImage.timestamp,
          width: latestImage.width,
          height: latestImage.height,
        } : null,
        detection: latestImage?.detections[0] ? {
          id: latestImage.detections[0].id,
          label: latestImage.detections[0].label,
          confidence: latestImage.detections[0].confidence,
          bbox: latestImage.detections[0].bbox,
          plantType: latestImage.detections[0].plantType,
          plantData: latestImage.detections[0].plantData,
        } : null,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Latest data fetch error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
