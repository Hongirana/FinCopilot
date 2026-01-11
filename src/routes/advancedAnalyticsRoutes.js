const express = require('express');
const router = express.Router();
const advancedAnalyticsController = require('../controllers/advancedAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to ALL routes in this file
router.use(authMiddleware);

/**
 * GET /api/advanced-analytics/health-score
 * Get budget health score (0-100)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "healthScore": 78.5,
 *     "rating": "Good"
 *   }
 * }
 */
router.get('/health-score', advancedAnalyticsController.getHealthScore);

/**
 * GET /api/advanced-analytics/financial-index
 * Get overall financial health index with breakdown
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "overallScore": 72.5,
 *     "metrics": {
 *       "savingsRate": 21.5,
 *       "budgetAdherence": 23.5,
 *       "goalProgress": 15.0,
 *       "expenseToIncomeRatio": 12.5
 *     },
 *     "rating": "Good"
 *   }
 * }
 */
router.get('/financial-index', advancedAnalyticsController.getFinancialIndex);

/**
 * GET /api/advanced-analytics/anomalies
 * Detect unusual spending patterns
 * 
 * Query Parameters:
 *   ?months=3 (optional, default 3)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "anomalyCount": 3,
 *     "anomalies": [
 *       {
 *         "date": "2026-01-05",
 *         "category": "shopping",
 *         "description": "Amazon purchase",
 *         "amount": "5000.00",
 *         "threshold": "2000.00",
 *         "severity": "high"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/anomalies', advancedAnalyticsController.detectAnomalies);

/**
 * GET /api/advanced-analytics/forecast
 * Get spending forecast using linear regression
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "forecast": {
 *       "forecast": "28500.50",
 *       "slope": "150.25",
 *       "trend": "increasing"
 *     },
 *     "historicalData": [...]
 *   }
 * }
 */
router.get('/forecast', advancedAnalyticsController.getSpendingForecast);

/**
 * GET /api/advanced-analytics/compare
 * Compare current spending with historical average
 * 
 * Query Parameters:
 *   ?category=food (required)
 *   ?amount=5000 (required)
 *   ?months=12 (optional, default 12)
 * 
 * Example:
 *   GET /api/advanced-analytics/compare?category=food&amount=5000&months=12
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "category": "food",
 *     "current": "5000.00",
 *     "historicalAverage": "3500.00",
 *     "difference": "1500.00",
 *     "percentChange": 42.86,
 *     "trend": "above average",
 *     "period": "12 months"
 *   }
 * }
 */
router.get('/compare', advancedAnalyticsController.compareWithAverage);

module.exports = router;
