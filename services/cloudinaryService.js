// services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFromBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'smart-plant-care',
        public_id: options.public_id,
        tags: options.tags || [],
        context: options.context,
        transformation: options.transformation,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (!result) {
          reject(new Error('No result from Cloudinary'));
        } else {
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            folder: result.folder,
            metadata: {
              created_at: result.created_at,
              resource_type: result.resource_type,
              type: result.type,
              version: result.version,
            },
          });
        }
      }
    );
    const bufferStream = Readable.from(buffer);
    bufferStream.pipe(uploadStream);
  });
}

export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

export function buildUrl(publicId, transformations = {}) {
  return cloudinary.url(publicId, { secure: true, ...transformations });
}

export async function getImageDetails(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get details error:', error);
    throw error;
  }
}
