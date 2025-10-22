// Worker script to aggregate sensor readings hourly
// This could be run as a cron job or scheduled task

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function aggregateReadings() {
  console.log('Starting telemetry aggregation...');
  
  // Get current time and calculate the previous hour's start/end
  const now = new Date();
  const hourAgo = new Date(now);
  hourAgo.setHours(now.getHours() - 1);
  hourAgo.setMinutes(0, 0, 0); // Start of the previous hour
  
  const hourEnd = new Date(hourAgo);
  hourEnd.setHours(hourEnd.getHours() + 1); // End of the previous hour
  
  console.log(`Aggregating data from ${hourAgo.toISOString()} to ${hourEnd.toISOString()}`);
  
  try {
    // Get all unique device IDs with readings in the past hour
    const devices = await prisma.sensorReading.findMany({
      where: {
        timestamp: {
          gte: hourAgo,
          lt: hourEnd
        }
      },
      select: {
        deviceId: true
      },
      distinct: ['deviceId']
    });
    
    console.log(`Found ${devices.length} devices with readings to aggregate`);
    
    // Process each device's readings
    for (const device of devices) {
      const deviceId = device.deviceId;
      
      // Get aggregate data for the device
      const aggregates = await prisma.$queryRaw`
        SELECT
          MIN(CASE WHEN "soilMoisture" IS NOT NULL THEN "soilMoisture" END) as "soilMin",
          MAX(CASE WHEN "soilMoisture" IS NOT NULL THEN "soilMoisture" END) as "soilMax",
          AVG(CASE WHEN "soilMoisture" IS NOT NULL THEN "soilMoisture" END) as "soilAvg",
          MIN(CASE WHEN "temperature" IS NOT NULL THEN "temperature" END) as "tempMin",
          MAX(CASE WHEN "temperature" IS NOT NULL THEN "temperature" END) as "tempMax",
          AVG(CASE WHEN "temperature" IS NOT NULL THEN "temperature" END) as "tempAvg",
          MIN(CASE WHEN "humidity" IS NOT NULL THEN "humidity" END) as "humidityMin",
          MAX(CASE WHEN "humidity" IS NOT NULL THEN "humidity" END) as "humidityMax",
          AVG(CASE WHEN "humidity" IS NOT NULL THEN "humidity" END) as "humidityAvg",
          MIN(CASE WHEN "light" IS NOT NULL THEN "light" END) as "lightMin",
          MAX(CASE WHEN "light" IS NOT NULL THEN "light" END) as "lightMax",
          AVG(CASE WHEN "light" IS NOT NULL THEN "light" END) as "lightAvg",
          COUNT(*) as "readingCount"
        FROM "SensorReading"
        WHERE "deviceId" = ${deviceId}
          AND "timestamp" >= ${hourAgo}
          AND "timestamp" < ${hourEnd}
      `;
      
      if (aggregates && aggregates.length > 0) {
        const agg = aggregates[0];
        
        // Skip if no readings found
        if (agg.readingCount === 0) continue;
        
        // Create or update the aggregation record
        await prisma.sensorAggregation.upsert({
          where: {
            deviceId_hour: {
              deviceId,
              hour: hourAgo
            }
          },
          update: {
            soilMin: agg.soilMin,
            soilMax: agg.soilMax,
            soilAvg: agg.soilAvg,
            tempMin: agg.tempMin,
            tempMax: agg.tempMax,
            tempAvg: agg.tempAvg,
            humidityMin: agg.humidityMin,
            humidityMax: agg.humidityMax,
            humidityAvg: agg.humidityAvg,
            lightMin: agg.lightMin,
            lightMax: agg.lightMax,
            lightAvg: agg.lightAvg,
            readingCount: agg.readingCount
          },
          create: {
            deviceId,
            hour: hourAgo,
            soilMin: agg.soilMin,
            soilMax: agg.soilMax,
            soilAvg: agg.soilAvg,
            tempMin: agg.tempMin,
            tempMax: agg.tempMax,
            tempAvg: agg.tempAvg,
            humidityMin: agg.humidityMin,
            humidityMax: agg.humidityMax,
            humidityAvg: agg.humidityAvg,
            lightMin: agg.lightMin,
            lightMax: agg.lightMax,
            lightAvg: agg.lightAvg,
            readingCount: agg.readingCount
          }
        });
        
        console.log(`Aggregated ${agg.readingCount} readings for device ${deviceId}`);
      }
    }
    
    console.log('Aggregation completed successfully');
    
  } catch (error) {
    console.error('Error during aggregation:', error);
  }
}

// Execute the aggregation
aggregateReadings()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });