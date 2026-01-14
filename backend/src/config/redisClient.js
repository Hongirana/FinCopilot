const redis = require('redis');
require('dotenv').config();

// Create Redis client
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('[Redis] Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      // Exponential backoff: wait longer between each retry
      const delay = Math.min(retries * 100, 3000);
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: 0
});

// Event handlers
redisClient.on('connect', () => {
  console.log('✅ [Redis] Connecting to Redis server...');
});

redisClient.on('ready', () => {
  console.log('✅ [Redis] Redis client ready and connected');
});

redisClient.on('error', (err) => {
  console.error('❌ [Redis] Redis client error:', err.message);
});

redisClient.on('reconnecting', () => {
  console.log('🔄 [Redis] Reconnecting to Redis server...');
});

redisClient.on('end', () => {
  console.log('⚠️  [Redis] Redis client connection closed');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ [Redis] Successfully connected to Redis');
  } catch (error) {
    console.error('❌ [Redis] Failed to connect to Redis:', error.message);
    console.error('⚠️  [Redis] Application will continue without caching');
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Redis] Closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Redis] Closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

/**
 * Check if Redis is connected
 * @returns {boolean} Connection status
 */
function isRedisConnected() {
  return redisClient.isReady;
}

/**
 * Get Redis client instance
 * @returns {RedisClient} Redis client
 */
function getRedisClient() {
  return redisClient;
}

module.exports = {
  redisClient,
  isRedisConnected,
  getRedisClient
};
