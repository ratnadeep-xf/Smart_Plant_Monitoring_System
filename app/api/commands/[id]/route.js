// app/api/commands/[id]/route.js
import { NextResponse } from 'next/server';
import { updateCommandStatus, getCommandById } from '../../../../services/deviceService.js';

/**
 * POST /api/commands/:id
 * Acknowledge command execution and update status
 * 
 * Body:
 * - status: 'started'|'completed'|'failed'
 * - result: object (optional, execution details)
 * 
 * Requires: Authorization: Bearer <DEVICE_TOKEN_SECRET>
 */
export async function POST(request, { params }) {
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

    const commandId = params.id;
    const body = await request.json();
    
    const { status, result } = body;

    if (!status || !['started', 'completed', 'failed'].includes(status)) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Invalid status. Must be: started, completed, or failed',
      }, { status: 400 });
    }

    // Update command status
    const updatedCommand = await updateCommandStatus(commandId, status, result);

    if (!updatedCommand) {
      return NextResponse.json({
        error: 'Not Found',
        message: 'Command not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedCommand,
    }, { status: 200 });
  } catch (error) {
    console.error('Command acknowledgment error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/commands/:id
 * Get command status by ID
 * 
 * Requires: Authorization: Bearer <DEVICE_TOKEN_SECRET>
 */
export async function GET(request, { params }) {
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

    const commandId = params.id;
    const command = await getCommandById(commandId);

    if (!command) {
      return NextResponse.json({
        error: 'Not Found',
        message: 'Command not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: command,
    }, { status: 200 });
  } catch (error) {
    console.error('Command fetch error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
