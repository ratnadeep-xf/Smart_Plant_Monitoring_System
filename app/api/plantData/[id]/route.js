// app/api/plantData/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

/**
 * GET /api/plantData/:id
 * Get detailed plant care information by plantDataId
 */
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Invalid plant data ID',
      }, { status: 400 });
    }

    const plantData = await prisma.plantData.findUnique({
      where: { id },
    });

    if (!plantData) {
      return NextResponse.json({
        error: 'Not Found',
        message: 'Plant data not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: plantData,
    }, { status: 200 });
  } catch (error) {
    console.error('Plant data fetch error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
