import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') || 'raspberry-pi-001';

    const client = await clientPromise;
    const db = client.db();

    // Get latest telemetry reading
    const latestReading = await db.collection('telemetry_readings').findOne(
      { device_id: deviceId },
      { sort: { timestamp: -1 } }
    );

    if (!latestReading) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = [];
    const now = new Date();
    const dataAge = now.getTime() - new Date(latestReading.timestamp).getTime();

    // Only send notifications for recent data (within last 30 seconds)
    if (dataAge < 30000) {
      // Soil moisture alert
      if (latestReading.soil_moisture_pct !== null && latestReading.soil_moisture_pct < 30) {
        notifications.push({
          type: 'warning',
          title: '💧 Low Soil Moisture',
          message: `Soil moisture at ${latestReading.soil_moisture_pct.toFixed(1)}%`,
          timestamp: latestReading.timestamp,
          id: `soil-${latestReading.timestamp}`,
        });
      }

      // Temperature alerts
      if (latestReading.temperature_c !== null) {
        if (latestReading.temperature_c > 35) {
          notifications.push({
            type: 'error',
            title: '🌡️ High Temperature',
            message: `Temperature is ${latestReading.temperature_c.toFixed(1)}°C`,
            timestamp: latestReading.timestamp,
            id: `temp-high-${latestReading.timestamp}`,
          });
        } else if (latestReading.temperature_c < 10) {
          notifications.push({
            type: 'warning',
            title: '❄️ Low Temperature',
            message: `Temperature is ${latestReading.temperature_c.toFixed(1)}°C`,
            timestamp: latestReading.timestamp,
            id: `temp-low-${latestReading.timestamp}`,
          });
        }
      }

      // Humidity alerts
      if (latestReading.humidity_pct !== null && latestReading.humidity_pct < 30) {
        notifications.push({
          type: 'warning',
          title: '💨 Low Humidity',
          message: `Humidity at ${latestReading.humidity_pct.toFixed(1)}%`,
          timestamp: latestReading.timestamp,
          id: `humidity-${latestReading.timestamp}`,
        });
      }

      // Light alerts
      if (latestReading.lux !== null && latestReading.lux < 200) {
        notifications.push({
          type: 'info',
          title: '🌙 Low Light',
          message: `Light level at ${latestReading.lux.toFixed(0)} lux`,
          timestamp: latestReading.timestamp,
          id: `light-${latestReading.timestamp}`,
        });
      }
    }

    // Check for recent watering commands (last 30 seconds)
    const recentCommand = await db.collection('commands').findOne(
      {
        device_id: deviceId,
        command_type: 'water',
        status: 'completed',
        executed_at: { $gte: new Date(Date.now() - 30000) },
      },
      { sort: { executed_at: -1 } }
    );

    if (recentCommand) {
      notifications.push({
        type: 'success',
        title: '🚰 Watering Completed',
        message: `Plant watered successfully`,
        timestamp: recentCommand.executed_at,
        id: `water-${recentCommand.id}`,
      });
    }

    return NextResponse.json({ 
      success: true,
      notifications 
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
