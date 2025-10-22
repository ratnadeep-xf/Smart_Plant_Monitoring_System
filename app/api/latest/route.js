export async function GET(request) {
  // This would fetch the latest readings from the database
  return Response.json({
    status: "success",
    data: {
      soil_moisture: 45,
      temperature: 22,
      humidity: 60,
      light: 75,
      last_reading: new Date().toISOString(),
      device_status: "online"
    }
  });
}