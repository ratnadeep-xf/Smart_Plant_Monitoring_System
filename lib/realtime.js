// Realtime communication helpers using Server-Sent Events (SSE)

// Map to store active SSE connections
const clients = new Map();

/**
 * Add a new SSE client
 * @param {string} clientId - Unique ID for the client
 * @param {object} res - Response object from Next.js API route 
 */
export function addClient(clientId, res) {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });
  
  // Send initial connection acknowledgement
  const data = `data: ${JSON.stringify({ event: 'connected', clientId })}\n\n`;
  res.write(data);
  
  // Store the client connection
  clients.set(clientId, res);
  
  // Handle client disconnect
  res.on('close', () => {
    clients.delete(clientId);
    res.end();
  });
}

/**
 * Send a message to all connected clients
 * @param {string} event - Event name 
 * @param {object} data - Data to send
 */
export function sendToAll(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (e) {
      console.error('Error sending SSE message:', e);
    }
  });
}

/**
 * Send a message to a specific client
 * @param {string} clientId - Target client ID
 * @param {string} event - Event name
 * @param {object} data - Data to send
 * @returns {boolean} - Whether the message was sent
 */
export function sendToClient(clientId, event, data) {
  const client = clients.get(clientId);
  if (!client) return false;
  
  try {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    client.write(message);
    return true;
  } catch (e) {
    console.error(`Error sending SSE message to client ${clientId}:`, e);
    return false;
  }
}