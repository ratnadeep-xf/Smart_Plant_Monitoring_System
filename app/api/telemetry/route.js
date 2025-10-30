// app/api/telemetry/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

/**
 * POST /api/telemetry
 * Accept sensor readings from Raspberry Pi device
 * 
 * Request body:
 * {
 *   device_id?: string,
 *   timestamp?: string (ISO 8601),
 *   soil_pct?: number,
 *   temperature_c?: number,
 *   humidity_pct?: number,
 *   lux?: number,
 *   image_id?: string (UUID),
 *   raw_payload?: object
 * }
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

    // Parse and validate request body
    const data = await request.json();

    // Insert reading into database
    const reading = await prisma.reading.create({
      data: {
        deviceId: data.device_id || 'default-device',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        soilPct: data.soil_pct,
        temperatureC: data.temperature_c,
        humidityPct: data.humidity_pct,
        lux: data.lux,
        imageId: data.image_id,
        rawPayload: data.raw_payload || data,
      },
    });

    console.log(`Telemetry received from device:`, {
      id: reading.id,
      timestamp: reading.timestamp,
    });

    // TODO: Emit realtime event for dashboard updates
    // await pusher.trigger('plant-monitor', 'telemetry-update', { reading });

    return NextResponse.json({
      success: true,
      data: {
        reading: {
          id: reading.id,
          timestamp: reading.timestamp,
          deviceId: reading.deviceId,
        },
        message: 'Telemetry received successfully',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Telemetry endpoint error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
