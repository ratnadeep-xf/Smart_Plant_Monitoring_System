// Script to seed the database with plant type data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with plant types...');
  
  // Define plant types and their optimal growing conditions
  const plants = [
    {
      name: 'Basil',
      label: 'basil',
      soilMin: 40,
      soilMax: 60,
      tempMin: 18,
      tempMax: 30,
      humidityMin: 40,
      humidityMax: 60,
      lightMin: 60,
      lightMax: 85,
      description: 'Aromatic herb that requires consistent moisture and plenty of light.'
    },
    {
      name: 'Mint',
      label: 'mint',
      soilMin: 45,
      soilMax: 70,
      tempMin: 18,
      tempMax: 26,
      humidityMin: 50,
      humidityMax: 70,
      lightMin: 50,
      lightMax: 75,
      description: 'Fast-growing herb that prefers moist soil and partial shade.'
    },
    {
      name: 'Rosemary',
      label: 'rosemary',
      soilMin: 30,
      soilMax: 50,
      tempMin: 20,
      tempMax: 32,
      humidityMin: 30,
      humidityMax: 50,
      lightMin: 70,
      lightMax: 95,
      description: 'Mediterranean herb that prefers dry conditions and full sun.'
    },
    {
      name: 'Thyme',
      label: 'thyme',
      soilMin: 25,
      soilMax: 45,
      tempMin: 18,
      tempMax: 32,
      humidityMin: 30,
      humidityMax: 50,
      lightMin: 70,
      lightMax: 95,
      description: 'Hardy herb that thrives in dry, sunny conditions with well-drained soil.'
    },
    {
      name: 'Cilantro',
      label: 'cilantro',
      soilMin: 40,
      soilMax: 65,
      tempMin: 15,
      tempMax: 24,
      humidityMin: 40,
      humidityMax: 60,
      lightMin: 50,
      lightMax: 75,
      description: 'Quick-growing herb that bolts in high heat, prefers cooler temperatures.'
    },
    {
      name: 'Parsley',
      label: 'parsley',
      soilMin: 40,
      soilMax: 65,
      tempMin: 15,
      tempMax: 26,
      humidityMin: 40,
      humidityMax: 70,
      lightMin: 55,
      lightMax: 85,
      description: 'Biennial herb that grows best in rich, moist soil with moderate sunlight.'
    },
    {
      name: 'Oregano',
      label: 'oregano',
      soilMin: 30,
      soilMax: 50,
      tempMin: 18,
      tempMax: 30,
      humidityMin: 30,
      humidityMax: 50,
      lightMin: 65,
      lightMax: 90,
      description: 'Mediterranean herb that prefers dry conditions and full sun.'
    },
    {
      name: 'Tomato',
      label: 'tomato',
      soilMin: 40,
      soilMax: 60,
      tempMin: 20,
      tempMax: 32,
      humidityMin: 40,
      humidityMax: 70,
      lightMin: 70,
      lightMax: 90,
      description: 'Fruit-bearing plant that requires consistent moisture and plenty of sunlight.'
    },
    {
      name: 'Lettuce',
      label: 'lettuce',
      soilMin: 45,
      soilMax: 65,
      tempMin: 15,
      tempMax: 24,
      humidityMin: 50,
      humidityMax: 70,
      lightMin: 50,
      lightMax: 75,
      description: 'Leafy green that grows best in cool weather and rich, moist soil.'
    }
  ];
  
  // Upsert each plant type (create if not exists, update if exists)
  for (const plant of plants) {
    await prisma.plantType.upsert({
      where: { name: plant.name },
      update: plant,
      create: plant,
    });
  }
  
  console.log(`Database seeded with ${plants.length} plant types!`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });