// Helper functions for rate limiting API endpoints
import { Redis } from '@upstash/redis';

// Initialize Redis client if configured
let redis;
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}

/**
 * Rate limiting utility for API routes
 * @param {string} key - Unique identifier for this rate limit (e.g. "water-command")
 * @param {number} limit - Maximum number of requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @param {object} req - Next.js request object
 * @returns {Promise<{success: boolean, limit: number, remaining: number, reset: Date}>}
 */
export async function rateLimit(key, limit, windowMs, req) {
  // If Redis isn't available, allow the request but warn
  if (!redis) {
    console.warn('Rate limiting is disabled - Redis not configured');
    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(Date.now() + windowMs),
    };
  }

  // Create a unique key based on the provided key and IP address
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const uniqueKey = `ratelimit:${key}:${ip}`;
  
  // Get current count and TTL
  const [count, ttl] = await Promise.all([
    redis.get(uniqueKey),
    redis.ttl(uniqueKey),
  ]);
  
  // Calculate values
  const currentCount = count ? parseInt(count) : 0;
  const reset = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : windowMs));
  const remaining = Math.max(0, limit - currentCount);
  const success = currentCount < limit;
  
  // Increment counter if within limits
  if (success) {
    await redis.incr(uniqueKey);
    // Set expiration if this is the first request in the window
    if (currentCount === 0) {
      await redis.expire(uniqueKey, Math.ceil(windowMs / 1000));
    }
  }
  
  return {
    success,
    limit,
    remaining,
    reset,
  };
}