// app/api/plantTypes/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

/**
 * GET /api/plantTypes
 * Get all plant types with their thresholds
 */
export async function GET(request) {
  try {
    const plantTypes = await prisma.plantType.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: plantTypes,
    }, { status: 200 });
  } catch (error) {
    console.error('Plant types fetch error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
