const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheDashboardMiddleware } = require('../middleware/cacheMiddleware');
const { lenientRateLimiter } = require('../middleware/rateLimitMiddleware');


router.get('/summary', authMiddleware,lenientRateLimiter, cacheDashboardMiddleware(300), dashboardController.getDashboardSummary);
router.get('/stats', authMiddleware, dashboardController.getFinancialStats);
router.get('/overview', authMiddleware, dashboardController.getQuickOverview);

module.exports = router;