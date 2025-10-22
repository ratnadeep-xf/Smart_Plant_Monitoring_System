export async function POST(request) {
  const { duration = 5 } = await request.json();
  
  // Here you would implement the rate limiting and safety controls
  // before sending a command to the device
  
  return Response.json({
    status: "success",
    message: "Watering command sent",
    duration: Math.min(duration, 10), // Cap at max duration
    next_allowed: new Date(Date.now() + 1800000).toISOString() // 30 min cooldown example
  });
}