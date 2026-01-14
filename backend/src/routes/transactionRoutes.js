const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const { transactionValidators, handleValidationErrors } = require('../middleware/validators');
const filterService = require('../services/filterService');
const { cacheTransactionsMiddleware } = require('../middleware/cacheMiddleware');
const { generalRateLimiter } = require('../middleware/rateLimitMiddleware');


router.get('/search', authMiddleware, transactionController.searchTransactions);

/**
 * GET /api/transactions/advanced-filter
 * Advanced transaction filtering with multiple criteria
 */
router.get('/advanced-filter', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, ...filters } = req.query;

    const result = await filterService.getFilteredTransactions(
      userId,
      filters,
      page,
      limit
    );

    res.json(result);

  } catch (error) {
    console.error('[TransactionRoutes] Advanced filter error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to apply advanced filters',
      message: error.message
    });
  }
});

/**
 * GET /api/transactions/filter-stats
 * Get statistics for filtered transactions
 * 
 * Uses same query parameters as advanced-filter
 * Returns: total count, income/expense sums, breakdown by type and category
 */
router.get('/filter-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ...filters } = req.query;

    const result = await filterService.getFilteredStats(userId, filters);

    res.json(result);

  } catch (error) {
    console.error('[TransactionRoutes] Filter stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get filter statistics',
      message: error.message
    });
  }
});



router.get('/', authMiddleware, generalRateLimiter, cacheTransactionsMiddleware(300), transactionController.listTransactions);

router.post('/', authMiddleware, generalRateLimiter, transactionValidators.create, handleValidationErrors, transactionController.createTransaction);
router.get('/:id', authMiddleware, transactionController.getTransactionById);
router.put('/:id', authMiddleware, generalRateLimiter, transactionValidators.update, handleValidationErrors, transactionController.updateTransaction);
router.delete('/:id', authMiddleware, generalRateLimiter, transactionController.deleteTransaction);
router.patch('/:id', authMiddleware, generalRateLimiter, transactionValidators.update, handleValidationErrors, transactionController.updateTransaction);
module.exports = router;