// services/labelMappingService.js
import prisma from '../lib/prisma.js';

/**
 * Look up plant data for a detection label by direct name matching
 * Matches against PlantType.name and PlantData.commonName (case-insensitive)
 * 
 * @param {string} label - Detection label from AI model
 * @param {number} confidence - Detection confidence (0-1)
 * @returns {Promise<object>} Mapping result with plant type and data IDs if matched
 */
export async function lookupMapping(label, confidence) {
  try {
    // Normalize the label for case-insensitive matching
    const normalizedLabel = label.toLowerCase().trim();

    // Try direct name matching in PlantType table
    const plantType = await prisma.plantType.findFirst({
      where: {
        name: { equals: label, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Try direct name matching in PlantData table
    const plantData = await prisma.plantData.findFirst({
      where: {
        commonName: { equals: label, mode: 'insensitive' },
      },
      select: {
        id: true,
        commonName: true,
      },
    });

    // If we found either PlantType or PlantData by direct name match
    if (plantType || plantData) {
      console.log(`Found match for "${label}": PlantType=${plantType?.name || 'none'}, PlantData=${plantData?.commonName || 'none'}`);
      return {
        plantTypeId: plantType?.id || null,
        plantDataId: plantData?.id || null,
        matched: true,
        minConfidence: 0.5,
        actualConfidence: confidence,
      };
    }

    // No match found
    console.log(`No plant data found for: ${label}`);
    return {
      plantTypeId: null,
      plantDataId: null,
      matched: false,
      minConfidence: 0,
      actualConfidence: confidence,
    };
  } catch (error) {
    console.error('Error looking up plant data:', error);
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
 * Get all plant types
 * @returns {Promise<Array>} Array of all plant types
 */
export async function getAllPlantTypes() {
  return await prisma.plantType.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get all plant data
 * @returns {Promise<Array>} Array of all plant data
 */
export async function getAllPlantData() {
  return await prisma.plantData.findMany({
    orderBy: {
      commonName: 'asc',
    },
  });
}
