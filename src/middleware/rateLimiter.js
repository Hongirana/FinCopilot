const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login (5 attempts per 15 minutes)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many login attempts. Please try again after 15 minutes.',
      statusCode: 429
    }
  },
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * Rate limiter for signup (10 attempts per hour)
 */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit to 10 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many signup attempts. Please try again after 1 hour.',
      statusCode: 429
    }
  },
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * General rate limiter for API endpoints (100 per hour)
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP. Please try again later.',
      statusCode: 429
    }
  },
  standardHeaders: false,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  signupLimiter,
  apiLimiter
};