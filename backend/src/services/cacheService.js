const { redisClient, isRedisConnected } = require('../config/redisClient');
require('dotenv').config();
// Default TTL (Time To Live) in seconds
const DEFAULT_TTL = parseInt(process.env.REDIS_TTL) || 3600;


/**
 * Set cache with key-value pair
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} Success status
 */
async function setCache(key, value, ttl = DEFAULT_TTL) {
    try {
        if (!isRedisConnected()) {
            console.warn('❌ [Redis] Redis client is not connected');
            return false;
        }
        const serializedValue = JSON.stringify(value);
        await redisClient.setEx(key, ttl, serializedValue);
        console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
        // await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
        return true;
    } catch (error) {
        console.error('❌ [Redis] Error setting cache:', error.message);
        return false;
    }
}

/**
 * Get cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached value or null if not found
 */

async function getCache(key) {
    try {
        if (!isRedisConnected()) {
            console.warn('❌ [Redis] Redis client is not connected');
            return null;
        }
        const cachedValue = await redisClient.get(key);
        if (cachedValue) {
            console.log(`[Cache] GET: ${key}`);
            return JSON.parse(cachedValue);
        }
        return null;
    } catch (error) {
        console.error('❌ [Redis] Error getting cache:', error.message);
        return null;
    }
}

/**
 * Delete cache by key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function deleteCache(key) {
    try {
        if (!isRedisConnected()) {
            console.warn('❌ [Redis] Redis client is not connected');
            return false;
        }
        await redisClient.del(key);
        console.log(`[Cache] DELETE: ${key}`);
        return true;
    } catch (error) {
        console.error('❌ [Redis] Error deleting cache:', error.message);
        return false;
    }
}


/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Key pattern (e.g., 'user:123:*')
 * @returns {Promise<number>} Number of keys deleted
 */
async function deleteCachePattern(pattern) {
    try {
        if (!isRedisConnected()) {
            return 0;
        }

        // Get all keys matching pattern
        const keys = await redisClient.keys(pattern);

        if (keys.length === 0) {
            console.log(`[Cache] No keys found matching pattern: ${pattern}`);
            return 0;
        }

        // Delete all matching keys
        await redisClient.del(keys);
        console.log(`[Cache] DELETED ${keys.length} keys matching: ${pattern}`);
        return keys.length;
    } catch (error) {
        console.error('[Cache] Delete pattern error:', error.message);
        return 0;
    }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} True if exists
 */
async function cacheExists(key) {
    try {
        if (!isRedisConnected()) {
            return false;
        }

        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (error) {
        console.error('[Cache] Exists check error:', error.message);
        return false;
    }
}

/**
 * Get remaining TTL for a key
 * @param {string} key - Cache key
 * @returns {Promise<number>} Remaining seconds (-1 if no TTL, -2 if not exists)
 */
async function getCacheTTL(key) {
    try {
        if (!isRedisConnected()) {
            return -2;
        }

        return await redisClient.ttl(key);
    } catch (error) {
        console.error('[Cache] TTL check error:', error.message);
        return -2;
    }
}

/**
 * Flush all cache (use with caution!)
 * @returns {Promise<boolean>} Success status
 */
async function flushCache() {
    try {
        if (!isRedisConnected()) {
            return false;
        }

        await redisClient.flushDb();
        console.log('[Cache] FLUSHED all cache');
        return true;
    } catch (error) {
        console.error('[Cache] Flush error:', error.message);
        return false;
    }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
async function getCacheStats() {
  try {
    if (!isRedisConnected()) {
      return {
        connected: false,
        totalKeys: 0,
        memory: 'N/A'
      };
    }

    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();
    const memory = await redisClient.info('memory');

    return {
      connected: true,
      totalKeys: dbSize,
      info: info,
      memory: memory
    };
  } catch (error) {
    console.error('[Cache] Stats error:', error.message);
    return {
      connected: false,
      error: error.message
    };
  }
}


//Specific Redis Caching Functions
/**
 * Cache dashboard data
 * @param {string} userId - User ID
 * @param {Object} data - Dashboard data
 * @param {number} ttl - TTL in seconds (default: 5 minutes)
 */
async function cacheDashboard(userId, data, ttl = 300) {
  const key = `dashboard:${userId}`;
  return await setCache(key, data, ttl);
}

/**
 * Get cached dashboard data
 * @param {string} userId - User ID
 */
async function getCachedDashboard(userId) {
  const key = `dashboard:${userId}`;
  return await getCache(key);
}

/**
 * Cache transactions list
 * @param {string} userId - User ID
 * @param {Object} filters - Filter parameters (for unique key)
 * @param {Array} transactions - Transactions data
 * @param {number} ttl - TTL in seconds (default: 10 minutes)
 */
async function cacheTransactions(userId, filters, transactions, ttl = 600) {
  const filterKey = JSON.stringify(filters || {});
  const key = `transactions:${userId}:${Buffer.from(filterKey).toString('base64')}`;
  return await setCache(key, transactions, ttl);
}

/**
 * Get cached transactions list
 * @param {string} userId - User ID
 * @param {Object} filters - Filter parameters
 */
async function getCachedTransactions(userId, filters) {
  const filterKey = JSON.stringify(filters || {});
  const key = `transactions:${userId}:${Buffer.from(filterKey).toString('base64')}`;
  return await getCache(key);
}

/**
 * Cache budget data
 * @param {string} userId - User ID
 * @param {Array} budgets - Budget data
 * @param {number} ttl - TTL in seconds (default: 15 minutes)
 */
async function cacheBudgets(userId, budgets, ttl = 900) {
  const key = `budgets:${userId}`;
  return await setCache(key, budgets, ttl);
}

/**
 * Get cached budget data
 * @param {string} userId - User ID
 */
async function getCachedBudgets(userId) {
  const key = `budgets:${userId}`;
  return await getCache(key);
}

/**
 * Cache analytics data
 * @param {string} userId - User ID
 * @param {string} period - Period identifier (e.g., '2026-01')
 * @param {Object} data - Analytics data
 * @param {number} ttl - TTL in seconds (default: 30 minutes)
 */
async function cacheAnalytics(userId, period, data, ttl = 1800) {
  const key = `analytics:${userId}:${period}`;
  return await setCache(key, data, ttl);
}

/**
 * Get cached analytics data
 * @param {string} userId - User ID
 * @param {string} period - Period identifier
 */
async function getCachedAnalytics(userId, period) {
  const key = `analytics:${userId}:${period}`;
  return await getCache(key);
}

/**
 * Invalidate all user-related cache
 * @param {string} userId - User ID
 */
async function invalidateUserCache(userId) {
  const patterns = [
    `dashboard:${userId}`,
    `transactions:${userId}:*`,
    `budgets:${userId}`,
    `analytics:${userId}:*`
  ];

  let totalDeleted = 0;
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      totalDeleted += await deleteCachePattern(pattern);
    } else {
      await deleteCache(pattern);
      totalDeleted++;
    }
  }

  console.log(`[Cache] Invalidated ${totalDeleted} keys for user ${userId}`);
  return totalDeleted;
}

/**
 * Invalidate transaction-related cache
 * @param {string} userId - User ID
 */
async function invalidateTransactionCache(userId) {
  await deleteCachePattern(`transactions:${userId}:*`);
  await deleteCache(`dashboard:${userId}`);
  console.log(`[Cache] Invalidated transaction cache for user ${userId}`);
}

/**
 * Invalidate budget-related cache
 * @param {string} userId - User ID
 */
async function invalidateBudgetCache(userId) {
  await deleteCache(`budgets:${userId}`);
  await deleteCache(`dashboard:${userId}`);
  console.log(`[Cache] Invalidated budget cache for user ${userId}`);
}


module.exports = {
  // Core cache operations
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  cacheExists,
  getCacheTTL,
  flushCache,
  getCacheStats,
  
  // Specialized cache functions
  cacheDashboard,
  getCachedDashboard,
  cacheTransactions,
  getCachedTransactions,
  cacheBudgets,
  getCachedBudgets,
  cacheAnalytics,
  getCachedAnalytics,
  
  // Cache invalidation
  invalidateUserCache,
  invalidateTransactionCache,
  invalidateBudgetCache
};