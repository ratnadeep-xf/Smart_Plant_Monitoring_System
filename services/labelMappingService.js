// services/labelMappingService.js
import prisma from '../lib/prisma.js';

/**
 * Look up label mapping for a detection label
 * Normalizes the label (lowercase, trim) and checks against LabelMapping table
 * Returns plantTypeId and plantDataId only if confidence meets minimum threshold
 * 
 * @param {string} label - Detection label from YOLO
 * @param {number} confidence - Detection confidence (0-1)
 * @returns {Promise<object>} Mapping result with plant type and data IDs if matched
 */
export async function lookupMapping(label, confidence) {
  try {
    // Normalize the label for case-insensitive matching
    const normalizedLabel = label.toLowerCase().trim();

    // Query the LabelMapping table
    const mapping = await prisma.labelMapping.findFirst({
      where: {
        OR: [
          { label: { equals: label, mode: 'insensitive' } },
          { normalized: normalizedLabel },
        ],
      },
      select: {
        plantTypeId: true,
        plantDataId: true,
        minConfidence: true,
      },
    });

    // If no mapping found, return unmatched result
    if (!mapping) {
      console.log(`No label mapping found for: ${label}`);
      return {
        plantTypeId: null,
        plantDataId: null,
        matched: false,
        minConfidence: 0,
        actualConfidence: confidence,
      };
    }

    // Check if confidence meets minimum threshold
    const minConfidence = mapping.minConfidence || 0.5;
    const meetsThreshold = confidence >= minConfidence;

    if (!meetsThreshold) {
      console.log(
        `Label "${label}" confidence ${confidence} below minimum ${minConfidence}`
      );
    }

    return {
      plantTypeId: meetsThreshold ? mapping.plantTypeId : null,
      plantDataId: meetsThreshold ? mapping.plantDataId : null,
      matched: meetsThreshold,
      minConfidence,
      actualConfidence: confidence,
    };
  } catch (error) {
    console.error('Error looking up label mapping:', error);
    return {
      plantTypeId: null,
      plantDataId: null,
      matched: false,
      minConfidence: 0,
      actualConfidence: confidence,
    };
  }
}

/**
 * Create or update a label mapping
 * @param {string} label - Detection label
 * @param {string|null} plantTypeId - Plant type ID (optional)
 * @param {string|null} plantDataId - Plant data ID (optional)
 * @param {number} minConfidence - Minimum confidence threshold
 * @returns {Promise<object>} Created or updated mapping
 */
export async function upsertMapping(label, plantTypeId, plantDataId, minConfidence = 0.5) {
  const normalizedLabel = label.toLowerCase().trim();

  return await prisma.labelMapping.upsert({
    where: { label },
    update: {
      normalized: normalizedLabel,
      plantTypeId,
      plantDataId,
      minConfidence,
      updatedAt: new Date(),
    },
    create: {
      label,
      normalized: normalizedLabel,
      plantTypeId,
      plantDataId,
      minConfidence,
    },
  });
}

/**
 * Get all label mappings
 * @returns {Promise<Array>} Array of all label mappings with related plant data
 */
export async function getAllMappings() {
  return await prisma.labelMapping.findMany({
    include: {
      plantType: true,
      plantData: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
