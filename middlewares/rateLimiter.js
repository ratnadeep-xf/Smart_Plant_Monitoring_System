// middlewares/rateLimiter.js

// Configuration from environment variables with defaults
const MAX_WATER_DURATION_SEC = parseInt(
  process.env.RATE_LIMIT_MAX_WATER_DURATION_SEC || '10',
  10
);
const COOLDOWN_MIN = parseInt(
  process.env.RATE_LIMIT_COOLDOWN_MIN || '15',
  10
);
const MAX_ACTIVATIONS_PER_HOUR = parseInt(
  process.env.RATE_LIMIT_MAX_ACTIVATIONS_PER_HOUR || '2',
  10
);

// In-memory storage for rate limiting
// TODO: Move to Redis for production/multi-instance deployments
const waterHistory = new Map();
const lastWaterTime = new Map();

/**
 * Check if a water command is allowed based on rate limits
 * Enforces:
 * - Maximum duration per activation
 * - Cooldown period between activations
 * - Maximum activations per hour
 * 
 * @param {string} deviceId - Device identifier
 * @param {number} durationSeconds - Requested watering duration
 * @returns {object} Rate limit check result
 */
function checkWaterRateLimit(deviceId, durationSeconds) {
  const now = new Date();

  // Check 1: Duration limit
  if (durationSeconds > MAX_WATER_DURATION_SEC) {
    return {
      allowed: false,
      reason: `Duration exceeds maximum allowed (${MAX_WATER_DURATION_SEC}s)`,
    };
  }

  // Check 2: Cooldown period
  const lastWater = lastWaterTime.get(deviceId);
  if (lastWater) {
    const cooldownMs = COOLDOWN_MIN * 60 * 1000;
    const timeSinceLastWater = now.getTime() - lastWater.getTime();

    if (timeSinceLastWater < cooldownMs) {
      const nextAllowedAt = new Date(lastWater.getTime() + cooldownMs);
      return {
        allowed: false,
        reason: `Cooldown period active. Next allowed at ${nextAllowedAt.toISOString()}`,
        nextAllowedAt,
      };
    }
  }

  // Check 3: Activations per hour
  const history = waterHistory.get(deviceId) || [];
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Filter events from the last hour
  const recentEvents = history.filter(
    (event) => event.timestamp.getTime() > oneHourAgo.getTime()
  );

  if (recentEvents.length >= MAX_ACTIVATIONS_PER_HOUR) {
    const oldestEvent = recentEvents[0];
    const nextAllowedAt = new Date(
      oldestEvent.timestamp.getTime() + 60 * 60 * 1000
    );

    return {
      allowed: false,
      reason: `Maximum activations per hour reached (${MAX_ACTIVATIONS_PER_HOUR}). Next allowed at ${nextAllowedAt.toISOString()}`,
      nextAllowedAt,
      remainingActivations: 0,
    };
  }

  // All checks passed
  return {
    allowed: true,
    remainingActivations: MAX_ACTIVATIONS_PER_HOUR - recentEvents.length - 1,
  };
}

/**
 * Record a water activation event
 * Call this after successfully queuing a water command
 * 
 * @param {string} deviceId - Device identifier
 * @param {number} durationSeconds - Watering duration
 */
function recordWaterEvent(deviceId, durationSeconds) {
  const now = new Date();

  // Update last water time
  lastWaterTime.set(deviceId, now);

  // Add to history
  const history = waterHistory.get(deviceId) || [];
  history.push({
    timestamp: now,
    duration: durationSeconds,
  });

  // Keep only events from the last hour
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const filteredHistory = history.filter(
    (event) => event.timestamp.getTime() > oneHourAgo.getTime()
  );

  waterHistory.set(deviceId, filteredHistory);
}

/**
 * Get rate limit status for a device
 * @param {string} deviceId - Device identifier
 * @returns {object} Current rate limit status
 */
function getWaterRateLimitStatus(deviceId) {
  const now = new Date();
  const lastWater = lastWaterTime.get(deviceId) || null;
  const history = waterHistory.get(deviceId) || [];
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentEvents = history.filter(
    (event) => event.timestamp.getTime() > oneHourAgo.getTime()
  );

  let nextAllowedAt = null;

  // Check cooldown
  if (lastWater) {
    const cooldownMs = COOLDOWN_MIN * 60 * 1000;
    const cooldownEnd = new Date(lastWater.getTime() + cooldownMs);
    if (cooldownEnd > now) {
      nextAllowedAt = cooldownEnd;
    }
  }

  // Check hourly limit
  if (recentEvents.length >= MAX_ACTIVATIONS_PER_HOUR && recentEvents[0]) {
    const hourlyLimitEnd = new Date(
      recentEvents[0].timestamp.getTime() + 60 * 60 * 1000
    );
    if (!nextAllowedAt || hourlyLimitEnd > nextAllowedAt) {
      nextAllowedAt = hourlyLimitEnd;
    }
  }

  return {
    lastWaterTime: lastWater,
    recentActivations: recentEvents.length,
    remainingActivations: Math.max(
      0,
      MAX_ACTIVATIONS_PER_HOUR - recentEvents.length
    ),
    nextAllowedAt,
  };
}

/**
 * Middleware wrapper for rate limiting
 * Usage in API route:
 *   const limitResult = rateLimiterMiddleware(req, res, deviceId, duration);
 *   if (!limitResult.allowed) {
 *     return; // Response already sent
 *   }
 */
function rateLimiterMiddleware(req, res, deviceId, durationSeconds) {
  const result = checkWaterRateLimit(deviceId, durationSeconds);

  if (!result.allowed) {
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: result.reason,
      nextAllowedAt: result.nextAllowedAt?.toISOString(),
      remainingActivations: result.remainingActivations,
    });
  }

  return result;
}

// Named exports for ES6 imports
export {
  checkWaterRateLimit,
  recordWaterEvent,
  getWaterRateLimitStatus,
  rateLimiterMiddleware,
};

// Default export for backward compatibility
export default {
  checkWaterRateLimit,
  recordWaterEvent,
  getWaterRateLimitStatus,
  rateLimiterMiddleware,
};
