// scripts/seedData.js
import prisma from '../lib/prisma.js';

/**
 * Seed database with sample plant types, plant data, and label mappings
 * Run with: npm run db:seed
 */
async function main() {
  console.log('Starting database seed...');

  // Create plant types with thresholds as JSON
  const basil = await prisma.plantType.upsert({
    where: { name: 'Basil' },
    update: {},
    create: {
      name: 'Basil',
      thresholds: {
        soil_min: 50,
        soil_max: 70,
        temp_min: 18,
        temp_max: 28,
        humidity_min: 40,
        humidity_max: 60,
        light_min: 300,
        light_max: 800,
      },
      notes: 'Aromatic herb requiring consistent moisture',
    },
  });
  console.log('Created plant type: Basil');

  const mint = await prisma.plantType.upsert({
    where: { name: 'Mint' },
    update: {},
    create: {
      name: 'Mint',
      thresholds: {
        soil_min: 60,
        soil_max: 80,
        temp_min: 15,
        temp_max: 25,
        humidity_min: 50,
        humidity_max: 70,
        light_min: 200,
        light_max: 600,
      },
      notes: 'Fast-growing herb preferring moist conditions',
    },
  });
  console.log('Created plant type: Mint');

  const rosemary = await prisma.plantType.upsert({
    where: { name: 'Rosemary' },
    update: {},
    create: {
      name: 'Rosemary',
      thresholds: {
        soil_min: 30,
        soil_max: 50,
        temp_min: 15,
        temp_max: 30,
        humidity_min: 30,
        humidity_max: 50,
        light_min: 400,
        light_max: 1000,
      },
      notes: 'Mediterranean herb, drought-tolerant',
    },
  });
  console.log('Created plant type: Rosemary');

  const tomato = await prisma.plantType.upsert({
    where: { name: 'Tomato' },
    update: {},
    create: {
      name: 'Tomato',
      thresholds: {
        soil_min: 55,
        soil_max: 75,
        temp_min: 20,
        temp_max: 30,
        humidity_min: 50,
        humidity_max: 70,
        light_min: 500,
        light_max: 1200,
      },
      notes: 'Requires consistent watering and support',
    },
  });
  console.log('Created plant type: Tomato');

  // Create plant data (care instructions)
  // Check if exists first, then create
  let basilData = await prisma.plantData.findFirst({
    where: { commonName: 'Sweet Basil' }
  });
  
  if (!basilData) {
    basilData = await prisma.plantData.create({
      data: {
        commonName: 'Sweet Basil',
        wateringAmountMl: 250,
        wateringFrequencyDays: 1,
        idealSunlightExposure: 'Full sun (6-8 hours daily)',
        idealRoomTemperatureC: 23,
        idealHumidityPercent: 50,
        idealSoilMoisturePercent: 60,
        idealSoilType: 'Well-draining potting mix',
        fertilizerType: 'Balanced NPK (10-10-10)',
        idealFertilizerAmountMl: 50,
        pestPresence: false,
        pestSeverity: null,
      },
    });
  }
  console.log('Created plant data: Sweet Basil');

  let mintData = await prisma.plantData.findFirst({
    where: { commonName: 'Peppermint' }
  });
  
  if (!mintData) {
    mintData = await prisma.plantData.create({
      data: {
        commonName: 'Peppermint',
        wateringAmountMl: 300,
        wateringFrequencyDays: 1,
        idealSunlightExposure: 'Partial shade to full sun (4-6 hours)',
        idealRoomTemperatureC: 20,
        idealHumidityPercent: 60,
        idealSoilMoisturePercent: 70,
        idealSoilType: 'Rich, moist soil',
        fertilizerType: 'Organic compost',
        idealFertilizerAmountMl: 30,
        pestPresence: false,
        pestSeverity: null,
      },
    });
  }
  console.log('Created plant data: Peppermint');

  let rosemaryData = await prisma.plantData.findFirst({
    where: { commonName: 'Rosemary Officinalis' }
  });
  
  if (!rosemaryData) {
    rosemaryData = await prisma.plantData.create({
      data: {
        commonName: 'Rosemary Officinalis',
        wateringAmountMl: 175,
        wateringFrequencyDays: 3,
        idealSunlightExposure: 'Full sun (6-8 hours daily)',
        idealRoomTemperatureC: 22,
        idealHumidityPercent: 40,
        idealSoilMoisturePercent: 40,
        idealSoilType: 'Sandy, well-draining soil',
        fertilizerType: 'Low-nitrogen fertilizer',
        idealFertilizerAmountMl: 20,
        pestPresence: false,
        pestSeverity: null,
      },
    });
  }
  console.log('Created plant data: Rosemary Officinalis');

  let tomatoData = await prisma.plantData.findFirst({
    where: { commonName: 'Cherry Tomato' }
  });
  
  if (!tomatoData) {
    tomatoData = await prisma.plantData.create({
      data: {
        commonName: 'Cherry Tomato',
        wateringAmountMl: 450,
        wateringFrequencyDays: 1,
        idealSunlightExposure: 'Full sun (8-10 hours daily)',
        idealRoomTemperatureC: 25,
        idealHumidityPercent: 60,
        idealSoilMoisturePercent: 65,
        idealSoilType: 'Rich, well-draining soil with organic matter',
        fertilizerType: 'Tomato-specific fertilizer (5-10-10)',
        idealFertilizerAmountMl: 100,
        pestPresence: false,
        pestSeverity: null,
      },
    });
  }
  console.log('Created plant data: Cherry Tomato');

  // Create label mappings (YOLO labels to PlantType/PlantData)
  await prisma.labelMapping.upsert({
    where: { label: 'basil' },
    update: {},
    create: {
      label: 'basil',
      normalized: 'basil',
      plantTypeId: basil.id,
      plantDataId: basilData.id,
      minConfidence: 0.5,
      notes: 'Common basil detection',
    },
  });
  console.log('Created label mapping: basil');

  await prisma.labelMapping.upsert({
    where: { label: 'sweet basil' },
    update: {},
    create: {
      label: 'sweet basil',
      normalized: 'basil',
      plantTypeId: basil.id,
      plantDataId: basilData.id,
      minConfidence: 0.5,
      notes: 'Sweet basil variant',
    },
  });
  console.log('Created label mapping: sweet basil');

  await prisma.labelMapping.upsert({
    where: { label: 'mint' },
    update: {},
    create: {
      label: 'mint',
      normalized: 'mint',
      plantTypeId: mint.id,
      plantDataId: mintData.id,
      minConfidence: 0.5,
      notes: 'Generic mint detection',
    },
  });
  console.log('Created label mapping: mint');

  await prisma.labelMapping.upsert({
    where: { label: 'peppermint' },
    update: {},
    create: {
      label: 'peppermint',
      normalized: 'mint',
      plantTypeId: mint.id,
      plantDataId: mintData.id,
      minConfidence: 0.5,
      notes: 'Peppermint variant',
    },
  });
  console.log('Created label mapping: peppermint');

  await prisma.labelMapping.upsert({
    where: { label: 'rosemary' },
    update: {},
    create: {
      label: 'rosemary',
      normalized: 'rosemary',
      plantTypeId: rosemary.id,
      plantDataId: rosemaryData.id,
      minConfidence: 0.5,
      notes: 'Rosemary detection',
    },
  });
  console.log('Created label mapping: rosemary');

  await prisma.labelMapping.upsert({
    where: { label: 'tomato' },
    update: {},
    create: {
      label: 'tomato',
      normalized: 'tomato',
      plantTypeId: tomato.id,
      plantDataId: tomatoData.id,
      minConfidence: 0.6,
      notes: 'Tomato plant detection',
    },
  });
  console.log('Created label mapping: tomato');

  await prisma.labelMapping.upsert({
    where: { label: 'cherry tomato' },
    update: {},
    create: {
      label: 'cherry tomato',
      normalized: 'tomato',
      plantTypeId: tomato.id,
      plantDataId: tomatoData.id,
      minConfidence: 0.6,
      notes: 'Cherry tomato variant',
    },
  });
  console.log('Created label mapping: cherry tomato');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });