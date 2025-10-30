// app/api/demo/populate/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

/**
 * POST /api/demo/populate
 * Populate database with demo data for testing UI
 * This creates sample readings, images, and detections
 */
export async function POST(request) {
  try {
    console.log('Populating demo data...');

    // Get plant types and plant data
    const basil = await prisma.plantType.findFirst({ where: { name: 'Basil' } });
    const basilData = await prisma.plantData.findFirst({ where: { commonName: 'Sweet Basil' } });

    if (!basil || !basilData) {
      return NextResponse.json({
        error: 'Setup Required',
        message: 'Please run "npm run db:seed" first to create plant types and data',
      }, { status: 400 });
    }

    // Create demo image
    const demoImage = await prisma.image.create({
      data: {
        publicId: 'demo/basil-plant',
        secureUrl: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=800',
        imageUrl: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=800',
        folder: 'demo',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 150000,
        timestamp: new Date(),
        metadata: {
          deviceId: 'demo-device',
          source: 'demo'
        }
      }
    });
    console.log('Created demo image');

    // Create demo detection
    const demoDetection = await prisma.detection.create({
      data: {
        imageId: demoImage.id,
        label: 'basil',
        confidence: 0.92,
        bbox: { x: 100, y: 150, width: 400, height: 350 },
        plantTypeId: basil.id,
        plantDataId: basilData.id,
        dominant: true,
      }
    });
    console.log('Created demo detection');

    // Create inference cache for the image
    await prisma.inferenceCache.create({
      data: {
        imageId: demoImage.id,
        provider: 'demo',
        responseJson: {
          predictions: [
            {
              class: 'basil',
              confidence: 0.92,
              x: 300,
              y: 325,
              width: 400,
              height: 350
            }
          ]
        }
      }
    });
    console.log('Created inference cache');

    // Create 20 demo readings with realistic fluctuations
    const baseValues = {
      soilPct: 55,
      temperatureC: 22,
      humidityPct: 58,
      lux: 450
    };

    const readings = [];
    const now = new Date();

    for (let i = 19; i >= 0; i--) {
      const timestamp = new Date(now);
      timestamp.setMinutes(now.getMinutes() - (i * 3)); // Every 3 minutes

      const reading = await prisma.reading.create({
        data: {
          timestamp,
          deviceId: 'demo-device',
          soilPct: baseValues.soilPct + (Math.random() - 0.5) * 10,
          temperatureC: baseValues.temperatureC + (Math.random() - 0.5) * 3,
          humidityPct: baseValues.humidityPct + (Math.random() - 0.5) * 8,
          lux: baseValues.lux + (Math.random() - 0.5) * 100,
          imageId: i === 0 ? demoImage.id : null, // Link latest reading to image
          rawPayload: {
            source: 'demo',
            iteration: 19 - i
          }
        }
      });
      readings.push(reading);
    }
    console.log(`Created ${readings.length} demo readings`);

    return NextResponse.json({
      success: true,
      message: 'Demo data populated successfully',
      data: {
        image: demoImage,
        detection: demoDetection,
        readingsCount: readings.length,
        latestReading: readings[readings.length - 1]
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error populating demo data:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/demo/populate
 * Clear all demo data
 */
export async function DELETE(request) {
  try {
    console.log('Clearing demo data...');

    // Delete readings
    await prisma.reading.deleteMany({
      where: { deviceId: 'demo-device' }
    });

    // Delete images and related data (cascades to detections and cache)
    await prisma.image.deleteMany({
      where: { 
        metadata: {
          path: ['source'],
          equals: 'demo'
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Demo data cleared successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error clearing demo data:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
