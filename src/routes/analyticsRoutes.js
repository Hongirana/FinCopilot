const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Analytics Routes

// 1. Spending by Category
// GET /api/analytics/spending/category
// Optional query params: startDate, endDate, accountId
router.get('/spending/category', analyticsController.getSpendsByCategory);

// 2. Monthly Report
// GET /api/analytics/spending/monthly?month=12&year=2025
// Required query params: month, year
// Optional: accountId
router.get('/spending/monthly', analyticsController.getMonthlyReport);

// 3. Yearly Summary
// GET /api/analytics/spending/yearly?year=2025
// Required query param: year
// Optional: accountId
router.get('/spending/yearly', analyticsController.getYearlySummary);

// 4. Custom Date Range Report
// GET /api/analytics/spending/range?startDate=2025-12-01&endDate=2025-12-31
// Required query params: startDate, endDate
// Optional: accountId
router.get('/spending/range', analyticsController.getDateRangeReport);

// 5. Spending Trends
// GET /api/analytics/trends?period=month&compare=3
// Required query param: period (week/month/year)
// Optional: compare (default: 3)
router.get('/trends', analyticsController.getSpendingTrends);

// 6. Top Spending Categories
// GET /api/analytics/top-categories?limit=5
// Optional query params: limit, startDate, endDate, accountId
router.get('/top-categories', analyticsController.getTopCategories);

module.exports = router;
