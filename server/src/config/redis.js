const Redis = require('ioredis');

const isTest = process.env.NODE_ENV === 'test';

let client = null;
let isRedisAvailable = false;

if (isTest) {
  // Use in-memory Redis mock for automated testing
  const RedisMock = require('ioredis-mock');
  client = new RedisMock();
  isRedisAvailable = true;
} else {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  const options = {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
    enableOfflineQueue: false
  };

  client = redisUrl ? new Redis(redisUrl, options) : new Redis({ host: redisHost, port: redisPort, ...options });

  client.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Connected successfully. Report caching enabled.');
  });

  client.on('error', (err) => {
    isRedisAvailable = false;
    // Suppress repeated connection logs if redis is not running
  });

  // Attempt connection gracefully without blocking server startup
  client.connect().catch(() => {
    isRedisAvailable = false;
  });
}

/**
 * Get cached report for user and date
 */
async function getCachedReports(userId, date) {
  if (!isRedisAvailable || !client) return null;
  try {
    const key = `reports:user:${userId}:date:${date}`;
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Store report in cache with TTL
 */
async function setCachedReports(userId, date, data, ttlSeconds = 3600) {
  if (!isRedisAvailable || !client) return;
  try {
    const key = `reports:user:${userId}:date:${date}`;
    await client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    // Fail silently if redis is unavailable
  }
}

/**
 * Invalidate all cached reports for a user when their readings change
 * Cleared on: Add reading, Edit reading, Delete reading
 */
async function invalidateUserReportsCache(userId) {
  if (!isRedisAvailable || !client) return;
  try {
    const pattern = `reports:user:${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    // Fail silently if redis is unavailable
  }
}

module.exports = {
  client,
  isAvailable: () => isRedisAvailable,
  getCachedReports,
  setCachedReports,
  invalidateUserReportsCache
};
