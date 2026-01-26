const { getCache, setCache } = require('../services/cacheService');

/**
 * Cache middleware for GET requests
 * Caches the response automatically for specified duration
 * 
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Optional custom key generator function
 * @returns {function} Express middleware
 * 
 * Usage:
 * router.get('/dashboard', authenticateToken, cacheMiddleware(300), getDashboard);
 */
const cacheMiddleware = (ttl = 300, keyGenerator) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req);

            // Try to get cached response
            const cachedData = await getCache(cacheKey);

            // If cached response exists, return it
            if (cachedData) {
               
                return res.status(200).json(cachedData);
            }

            // Store original res.json function
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Only cache successful responses (2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Cache the response asynchronously (don't wait)
                    setCache(cacheKey, data, ttl).catch(err => {
                        console.error('[Cache Middleware] Failed to cache response:', err.message);
                    });
                }

                // Return original response
                return originalJson(data);
            };

            // Call the next middleware
            next();

        } catch (error) {
            console.error('Error caching response:', error);
            next(error);
        }
    }
}


/**
 * Generate cache key from request
 * Format: method:path:userId:queryParams
 * 
 * @param {Request} req - Express request object
 * @returns {string} Cache key
 */
function generateCacheKey(req) {
    const userId = req.user?.id || 'anonymous';
    const path = req.path;
    const queryString = JSON.stringify(req.query);

    // Create unique key based on user, path, and query params
    const key = `${req.method}:${path}:${userId}:${Buffer.from(queryString).toString('base64')}`;

    return key;
}

/**
 * Dashboard-specific cache middleware
 * Caches dashboard data with custom key
 * 
 * @param {number} ttl - TTL in seconds (default: 300 = 5 minutes)
 */
function cacheDashboardMiddleware(ttl = 300) {
    return cacheMiddleware(ttl, (req) => {
        const userId = req.user.id;
        return `dashboard:${userId}`;
    });
}

/**
 * Transactions-specific cache middleware
 * Caches transaction lists with filter-based key
 * 
 * @param {number} ttl - TTL in seconds (default: 600 = 10 minutes)
 */
function cacheTransactionsMiddleware(ttl = 600) {
    return cacheMiddleware(ttl, (req) => {
        const userId = req.user.id;
        const filters = JSON.stringify(req.query);
        return `transactions:${userId}:${Buffer.from(filters).toString('base64')}`;
    });
}

/**
 * Analytics-specific cache middleware
 * Caches analytics with month/year or date range
 * 
 * @param {number} ttl - TTL in seconds (default: 1800 = 30 minutes)
 */
function cacheAnalyticsMiddleware(ttl = 1800) {
    return cacheMiddleware(ttl, (req) => {
        const userId = req.user.id;
        const { month, year, startDate, endDate } = req.query;

        let period;
        if (month && year) {
            period = `${year}-${month.toString().padStart(2, '0')}`;
        } else if (startDate && endDate) {
            period = `${startDate}_${endDate}`;
        } else {
            period = 'current';
        }

        return `analytics:${userId}:${period}`;
    });
}

/**
 * Budgets-specific cache middleware
 * Caches budget data
 * 
 * @param {number} ttl - TTL in seconds (default: 900 = 15 minutes)
 */
function cacheBudgetsMiddleware(ttl = 900) {
    return cacheMiddleware(ttl, (req) => {
        const userId = req.user.id;
        return `budgets:${userId}`;
    });
}

/**
 * Goals-specific cache middleware
 * Caches goal data
 * 
 * @param {number} ttl - TTL in seconds (default: 900 = 15 minutes)
 */
function cacheGoalsMiddleware(ttl = 900) {
    return cacheMiddleware(ttl, (req) => {
        const userId = req.user.id;
        return `goals:${userId}`;
    });
}

/**
 * No-cache middleware
 * Explicitly disable caching for sensitive endpoints
 */
function noCacheMiddleware(req, res, next) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
}

/**
 * Cache control headers middleware
 * Add cache control headers to response
 * 
 * @param {number} maxAge - Max age in seconds
 */
function cacheControlMiddleware(maxAge = 300) {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        }
        next();
    };
}

module.exports = {
    cacheMiddleware,
    cacheDashboardMiddleware,
    cacheTransactionsMiddleware,
    cacheAnalyticsMiddleware,
    cacheBudgetsMiddleware,
    cacheGoalsMiddleware,
    noCacheMiddleware,
    cacheControlMiddleware,
    generateCacheKey
};