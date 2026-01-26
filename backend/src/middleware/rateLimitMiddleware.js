const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redisClient, isRedisConnected } = require('../config/redisClient');
require('dotenv').config();
/**
 * Create Redis-backed rate limiter store
 * Falls back to memory store if Redis is unavailable
 */
function createRateLimitStore() {
  if (isRedisConnected()) {
    return new RedisStore({
      client: redisClient,
      prefix: 'rate_limit:',
      sendCommand: (...args) => redisClient.sendCommand(args)
    });
  } else {
    console.warn('[RateLimit] Redis unavailable, using memory store (not recommended for production)');
    return undefined; // express-rate-limit will use default memory store
  }
}

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 * Use for: Most API endpoints
 */
const generalRateLimiter = rateLimit({
  store: createRateLimitStore(),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] IP ${req.ip} exceeded general rate limit`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Strict rate limiter for sensitive operations
 * Limits: 10 requests per 15 minutes per IP
 * Use for: Login, Signup, Password reset, OTP verification
 */
const strictRateLimiter = rateLimit({
  store: createRateLimitStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 10 requests per window
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] IP ${req.ip} exceeded strict rate limit on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Lenient rate limiter for read-only operations
 * Limits: 200 requests per 15 minutes per IP
 * Use for: Dashboard, Analytics, Reports (GET requests)
 */
const lenientRateLimiter = rateLimit({
  store: createRateLimitStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] IP ${req.ip} exceeded lenient rate limit`);
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Heavy operation rate limiter
 * Limits: 20 requests per hour per IP
 * Use for: Report generation, PDF/Excel exports, Bulk operations
 */
const heavyOperationRateLimiter = rateLimit({
  store: createRateLimitStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Heavy operation limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] IP ${req.ip} exceeded heavy operation limit on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'You have exceeded the limit for heavy operations. Please try again in an hour.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * User-specific rate limiter
 * Limits per authenticated user ID instead of IP
 * Limits: 500 requests per 15 minutes per user
 * 
 * FIX: Uses skip() instead of keyGenerator to avoid IPv6 issues
 */
const userRateLimiter = rateLimit({
  store: createRateLimitStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per user per window
  // FIX: Use skip() for non-authenticated users instead of custom keyGenerator
  skip: (req) => {
    // Skip rate limiting for non-authenticated requests (will use IP-based limiting instead)
    return !req.user?.id;
  },
  keyGenerator: (req, res) => {
    // Only called for authenticated users (when skip returns false)
    // Use user ID as the key
    return `user:${req.user.id}`;
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const identifier = req.user?.id || req.ip;
    console.warn(`[RateLimit] User/IP ${identifier} exceeded user rate limit`);
    res.status(429).json({
      success: false,
      message: 'You have made too many requests. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * AI operation rate limiter
 * Limits: 50 requests per hour per user
 * Use for: AI categorization, LLM API calls, AI-powered features
 * 
 * FIX: Uses skip() to handle non-authenticated users
 */
const aiOperationRateLimiter = rateLimit({
  store: createRateLimitStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI operations per hour
  skip: (req) => {
    return !req.user?.id;
  },
  keyGenerator: (req, res) => {
    return `ai:${req.user.id}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] AI operation limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'AI operation limit exceeded. Please try again in an hour.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Create custom rate limiter with specific configuration
 * @param {Object} options - Rate limiter options
 * @returns {function} Rate limiter middleware
 */
function createCustomRateLimiter(options) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests',
    useUserKey = false // Whether to use user ID as key
  } = options;

  const config = {
    store: createRateLimitStore(),
    windowMs,
    max,
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`[RateLimit] Custom rate limit exceeded: ${req.path}`);
      res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      });
    }
  };

  // Add user-based key generator if requested
  if (useUserKey) {
    config.skip = (req) => !req.user?.id;
    config.keyGenerator = (req, res) => `custom:${req.user.id}`;
  }

  return rateLimit(config);
}

/**
 * Skip rate limiting for certain conditions
 * @param {function} rateLimiter - Rate limiter middleware
 * @param {function} condition - Function that returns true to skip
 * @returns {function} Conditional rate limiter
 */
function conditionalRateLimiter(rateLimiter, condition) {
  return (req, res, next) => {
    if (condition(req)) {
      return next();
    }
    return rateLimiter(req, res, next);
  };
}

/**
 * Whitelist IPs from rate limiting
 */
const whitelistedIPs = (process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(ip => ip.trim());

function isWhitelisted(req) {
  return whitelistedIPs.includes(req.ip);
}

function rateLimiterWithWhitelist(rateLimiter) {
  return conditionalRateLimiter(rateLimiter, isWhitelisted);
}

module.exports = {
  // Core rate limiters
  generalRateLimiter,
  strictRateLimiter,
  lenientRateLimiter,
  heavyOperationRateLimiter,
  userRateLimiter,
  aiOperationRateLimiter,
  
  // Utility functions
  createCustomRateLimiter,
  conditionalRateLimiter,
  rateLimiterWithWhitelist,
  isWhitelisted
};
