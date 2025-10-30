// app/api/commands/route.js
import { NextResponse } from 'next/server';
import { getQueuedCommands } from '../../../services/deviceService.js';

/**
 * GET /api/commands
 * Device polling endpoint to check for queued commands
 * 
 * Query params:
 * - device_id: string (required)
 * 
 * Requires: Authorization: Bearer <DEVICE_TOKEN_SECRET>
 */
export async function GET(request) {
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

    // Get device_id from query params
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id') || 'default-device';

    // Get queued commands
    const commands = await getQueuedCommands(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        commands,
        count: commands.length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Commands fetch error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
