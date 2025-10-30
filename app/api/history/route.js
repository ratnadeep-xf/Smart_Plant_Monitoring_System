// app/api/history/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

/**
 * GET /api/history
 * Query historical sensor readings with filtering and aggregation
 * 
 * Query params:
 * - sensor: 'soil'|'temperature'|'humidity'|'light' (optional)
 * - from: ISO 8601 date string (optional)
 * - to: ISO 8601 date string (optional)
 * - agg: 'raw'|'hourly' (default: 'raw')
 * - limit: number (default: 100, max: 1000)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const sensor = searchParams.get('sensor');
    const from = searchParams.get('from') ? new Date(searchParams.get('from')) : null;
    const to = searchParams.get('to') ? new Date(searchParams.get('to')) : null;
    const agg = searchParams.get('agg') || 'raw';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    // Build where clause
    const where = {};
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = from;
      if (to) where.timestamp.lte = to;
    }

    if (agg === 'hourly') {
      // Aggregated hourly data
      const readings = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          AVG(soil_moisture) as avg_soil_moisture,
          AVG(temperature) as avg_temperature,
          AVG(humidity) as avg_humidity,
          AVG(light_level) as avg_light_level,
          MIN(soil_moisture) as min_soil_moisture,
          MAX(soil_moisture) as max_soil_moisture,
          MIN(temperature) as min_temperature,
          MAX(temperature) as max_temperature,
          MIN(humidity) as min_humidity,
          MAX(humidity) as max_humidity,
          MIN(light_level) as min_light_level,
          MAX(light_level) as max_light_level,
          COUNT(*) as reading_count
        FROM "Reading"
        WHERE 
          ${from ? prisma.$queryRaw`timestamp >= ${from}::timestamp` : prisma.$queryRaw`TRUE`}
          AND ${to ? prisma.$queryRaw`timestamp <= ${to}::timestamp` : prisma.$queryRaw`TRUE`}
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT ${limit}
      `;

      return NextResponse.json({
        success: true,
        data: {
          aggregation: 'hourly',
          readings,
        },
      }, { status: 200 });
    } else {
      // Raw readings
      const readings = await prisma.reading.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: sensor ? {
          id: true,
          timestamp: true,
          deviceId: true,
          soilMoisture: sensor === 'soil',
          temperature: sensor === 'temperature',
          humidity: sensor === 'humidity',
          lightLevel: sensor === 'light',
        } : undefined,
      });

      return NextResponse.json({
        success: true,
        data: {
          aggregation: 'raw',
          count: readings.length,
          readings,
        },
      }, { status: 200 });
    }
  } catch (error) {
    console.error('History query error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
