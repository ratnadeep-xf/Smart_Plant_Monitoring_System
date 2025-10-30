// utils/validators.js
const { z } = require('zod');

/**
 * Telemetry POST request validation schema
 */
const telemetrySchema = z.object({
  device_id: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  soil_pct: z.number().min(0).max(100).optional(),
  temperature_c: z.number().min(-50).max(100).optional(),
  humidity_pct: z.number().min(0).max(100).optional(),
  lux: z.number().min(0).optional(),
  image_id: z.string().uuid().optional(),
  raw_payload: z.record(z.string(), z.any()).optional(),
});

/**
 * Water control POST request validation schema
 */
const waterControlSchema = z.object({
  device_id: z.string().default('default-device'),
  duration_seconds: z.number().min(1).max(15).default(5),
});

/**
 * Command acknowledgment POST request validation schema
 */
const commandAckSchema = z.object({
  status: z.enum(['started', 'completed', 'failed']),
  timestamp: z.string().datetime().optional(),
  result: z.record(z.string(), z.any()).optional(),
});

/**
 * History query parameters validation schema
 */
const historyQuerySchema = z.object({
  sensor: z
    .enum(['soil', 'temperature', 'humidity', 'light', 'all'])
    .optional()
    .default('all'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  agg: z.enum(['raw', 'hourly']).optional().default('raw'),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
});

/**
 * Validate request body against a Zod schema
 * @param {object} schema - Zod schema
 * @param {any} data - Data to validate
 * @returns {object} Validation result
 */
function validateRequest(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Validate and sanitize file upload
 * @param {object} file - Uploaded file
 * @returns {object} Validation result
 */
function validateImageUpload(file) {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!file.mimetype || !ALLOWED_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  if (!file.size || file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

module.exports = {
  telemetrySchema,
  waterControlSchema,
  commandAckSchema,
  historyQuerySchema,
  validateRequest,
  validateImageUpload,
};
