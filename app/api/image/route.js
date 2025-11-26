// app/api/image/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';
import { uploadFromBuffer } from '../../../services/cloudinaryService.js';
import { inferByUrl } from '../../../services/huggingFaceService.js';
import { lookupMapping } from '../../../services/labelMappingService.js';

/**
 * Process AI inference in background (non-blocking)
 */
async function processImageAI(imageId, imageUrl) {
  try {
    console.log(`[Background] Starting AI inference for image ${imageId}`);

    // Check if already processed
    const existingCache = await prisma.inferenceCache.findUnique({
      where: { imageId },
    });

    if (existingCache) {
      console.log(`[Background] Image ${imageId} already has inference cache, skipping`);
      return;
    }

    // Call Hugging Face AI model
    const aiResult = await inferByUrl(imageUrl);

    // Store in cache
    await prisma.inferenceCache.create({
      data: {
        imageId,
        provider: aiResult.provider,
        responseJson: aiResult.error 
          ? { error: aiResult.error, detections: [] }
          : aiResult.rawResponse,
      },
    });

    console.log(`[Background] AI inference cached for image ${imageId}`);

    // Create Detection records
    if (aiResult.detections && aiResult.detections.length > 0) {
      for (const det of aiResult.detections) {
        const mapping = await lookupMapping(det.label, det.confidence);

        await prisma.detection.create({
          data: {
            imageId,
            label: det.label,
            confidence: det.confidence,
            plantTypeId: mapping.plantTypeId,
            plantDataId: mapping.plantDataId,
          },
        });
      }
      console.log(`[Background] Created ${aiResult.detections.length} detection(s) for image ${imageId}`);
    } else {
      console.log(`[Background] No detections found for image ${imageId}`);
    }
  } catch (error) {
    console.error(`[Background] AI processing error for image ${imageId}:`, error);
    // Don't throw - let it fail silently in background
  }
}

/**
 * POST /api/image
 * Accept image uploads from Raspberry Pi device
 * Uploads to Cloudinary, returns immediately, processes AI in background
 * 
 * Form data:
 * - device_id: string
 * - timestamp: string (ISO 8601)
 * - image: file
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

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const deviceId = formData.get('device_id') || 'default-device';
    const timestamp = formData.get('timestamp') ? new Date(formData.get('timestamp')) : new Date();

    if (!imageFile) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'No image file provided',
      }, { status: 400 });
    }

    // Validate it's actually a file
    if (typeof imageFile === 'string') {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Image field contains string instead of file',
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate buffer is not empty and is valid image data
    if (buffer.length === 0) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Empty image buffer',
      }, { status: 400 });
    }

    // Check if buffer starts with valid image magic bytes (JPEG or PNG)
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;
    
    if (!isJPEG && !isPNG) {
      console.error('Invalid image format. First bytes:', buffer.slice(0, 20).toString('hex'));
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Invalid image format. Expected JPEG or PNG.',
      }, { status: 400 });
    }

    // Upload to Cloudinary
    console.log(`Uploading image to Cloudinary... (${buffer.length} bytes, ${isJPEG ? 'JPEG' : 'PNG'})`);
    const cloudinaryResult = await uploadFromBuffer(buffer, {
      folder: 'smart-plant-care',
      tags: [deviceId, 'plant-detection'],
    });

    // Insert Image record
    const image = await prisma.image.create({
      data: {
        publicId: cloudinaryResult.publicId,
        secureUrl: cloudinaryResult.secureUrl,
        imageUrl: cloudinaryResult.secureUrl, // legacy field
        timestamp,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
        folder: cloudinaryResult.folder,
        metadata: {
          ...cloudinaryResult.metadata,
          deviceId, // store deviceId in metadata
        },
      },
    });

    console.log(`Image uploaded: ${image.id}`);

    // Return immediately with image info - AI processing will happen asynchronously
    const response = {
      success: true,
      data: {
        image: {
          id: image.id,
          url: cloudinaryResult.secureUrl,
          publicId: cloudinaryResult.publicId,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          timestamp: image.timestamp,
        },
        detections: [], // Will be populated by background processing
        dominant: null,
        processing: true, // Indicates AI inference is in progress
      },
    };

    // Trigger AI processing in background (don't await)
    processImageAI(image.id, cloudinaryResult.secureUrl).catch(err => {
      console.error(`Background AI processing failed for image ${image.id}:`, err);
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
    }, { status: 500 });
  }
}
