// app/api/control/water/route.js
import { NextResponse } from 'next/server';
import { checkWaterRateLimit, recordWaterEvent } from '../../../../middlewares/rateLimiter.js';
import { queueCommand } from '../../../../services/deviceService.js';

/**
 * POST /api/control/water
 * Queue a water command for the device
 * Rate limited: max 10s duration, 15min cooldown, 2 activations per hour
 * 
 * Body:
 * - device_id: string (optional, defaults to 'default-device')
 * - duration: number (seconds, max 10)
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

    // Parse request body
    const body = await request.json();
    const deviceId = body.device_id || 'default-device';
    const duration = Math.min(parseInt(body.duration) || 5, 10); // Cap at 10 seconds

    // Check rate limit
    const rateLimitCheck = checkWaterRateLimit(deviceId);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        error: 'Too Many Requests',
        message: rateLimitCheck.reason,
        nextAllowedAt: rateLimitCheck.nextAllowedAt,
        remainingActivations: rateLimitCheck.remainingActivations,
      }, { status: 429 });
    }

    // Queue the water command
    const command = await queueCommand({
      deviceId,
      type: 'water',
      payload: { duration },
    });

    // Record the water event
    recordWaterEvent(deviceId, duration);

    return NextResponse.json({
      success: true,
      data: {
        commandId: command.id,
        duration,
        nextAllowedAt: rateLimitCheck.nextAllowedAt,
        remainingActivations: rateLimitCheck.remainingActivations - 1,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Water control error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
