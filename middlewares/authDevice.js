// middlewares/authDevice.js
const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || '';

/**
 * Middleware to authenticate device requests via Bearer token
 * Checks Authorization header for "Bearer <token>"
 * Validates against DEVICE_TOKEN_SECRET from environment
 * 
 * Usage in API route:
 *   const authResult = authDevice(req, res);
 *   if (!authResult.authenticated) {
 *     return; // Response already sent by middleware
 *   }
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @returns {object} Authentication result
 */
function authDevice(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
      return { authenticated: false };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Simple token validation - in production, use JWT or more sophisticated auth
    if (!DEVICE_TOKEN_SECRET) {
      console.error('DEVICE_TOKEN_SECRET not configured');
      res.status(500).json({
        error: 'Configuration Error',
        message: 'Device authentication not configured',
      });
      return { authenticated: false };
    }

    if (token !== DEVICE_TOKEN_SECRET) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid device token',
      });
      return { authenticated: false };
    }

    // Extract device ID from request body or query params
    const deviceId =
      req.body?.device_id ||
      req.query?.device_id ||
      'default-device';

    // Attach device info to request for use in handlers
    req.deviceId = deviceId;
    req.authenticated = true;

    return {
      authenticated: true,
      deviceId: deviceId,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
    return { authenticated: false };
  }
}

/**
 * Optional device auth - doesn't fail if auth is missing, just marks as unauthenticated
 * Useful for endpoints that accept both device and web requests
 */
function optionalAuthDevice(req) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false };
    }

    const token = authHeader.substring(7);

    if (!DEVICE_TOKEN_SECRET || token !== DEVICE_TOKEN_SECRET) {
      return { authenticated: false };
    }

    const deviceId =
      req.body?.device_id ||
      req.query?.device_id ||
      'default-device';

    req.deviceId = deviceId;
    req.authenticated = true;

    return {
      authenticated: true,
      deviceId: deviceId,
    };
  } catch (error) {
    console.error('Optional auth error:', error);
    return { authenticated: false };
  }
}

module.exports = authDevice;
module.exports.authDevice = authDevice;
module.exports.optionalAuthDevice = optionalAuthDevice;
