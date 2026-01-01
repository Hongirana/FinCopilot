const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware, dashboardController.getDashboardSummary);
router.get('/stats', authMiddleware, dashboardController.getFinancialStats);
router.get('/overview', authMiddleware, dashboardController.getQuickOverview);

module.exports = router;