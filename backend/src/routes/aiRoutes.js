const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const aiService = require('../services/aiServices');
const aiFeedbackService = require('../services/aiFeedbackServices');
const prisma = require('../prismaClient');
const { aiOperationRateLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * POST /api/ai/categorize
 * Categorize a single transaction
 */
router.post('/categorize', authMiddleware, aiOperationRateLimiter, async (req, res) => {
  try {
    const { description, amount, merchant, type } = req.body;

    // Validate input
    if (!description || !amount) {
      return res.status(400).json({
        error: 'Description and amount are required'
      });
    }

    const result = await aiService.categorizeTransaction({
      description,
      amount,
      merchant,
      type: type || 'expense'
    });

    res.json(result);

  } catch (error) {
    console.error('[AI Routes] Error:', error.message);
    res.status(500).json({
      error: 'Failed to categorize transaction',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/categorize/bulk
 * Bulk categorize uncategorized transactions for current user
 */
router.post('/categorize/bulk', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get uncategorized transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        category: 'other' // Only uncategorized
      },
      take: 10, // Limit to 10 at a time to avoid rate limits
      orderBy: {
        date: 'desc'
      }
    });

    if (transactions.length === 0) {
      return res.json({
        message: 'No uncategorized transactions found',
        results: []
      });
    }

    console.log(`[AI Routes] Bulk categorizing ${transactions.length} transactions`);

    const results = await aiService.bulkCategorize(transactions);

    res.json({
      message: `Categorized ${results.length} transactions`,
      results: results
    });

  } catch (error) {
    console.error('[AI Routes] Bulk categorize error:', error.message);
    res.status(500).json({
      error: 'Failed to bulk categorize',
      message: error.message
    });
  }
});

/**
 * PATCH /api/ai/apply-category/:transactionId
 * Apply AI suggested category to a transaction
 */
router.patch('/apply-category/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { category } = req.body;
    const userId = req.user.id;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update category
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { category: category }
    });

    res.json({
      message: 'Category applied successfully',
      transaction: updated
    });

  } catch (error) {
    console.error('[AI Routes] Apply category error:', error.message);
    res.status(500).json({
      error: 'Failed to apply category',
      message: error.message
    });
  }
});

/**
 * PATCH /api/ai/feedback/:transactionId
 * Record user feedback on AI categorization
 */
router.patch('/feedback/:transactionId', authMiddleware, aiOperationRateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.params;
    const { suggestedCategory, actualCategory, confidence } = req.body;

    // Validate input
    if (!suggestedCategory || !actualCategory) {
      return res.status(400).json({
        error: 'suggestedCategory and actualCategory are required'
      });
    }

    // Record feedback
    const feedback = await aiFeedbackService.recordFeedback(
      userId,
      transactionId,
      suggestedCategory,
      actualCategory,
      confidence || 0
    );

    res.json({
      success: true,
      message: 'Feedback recorded successfully',
      data: feedback
    });

  } catch (error) {
    console.error('[AI Routes] Feedback error:', error.message);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/accuracy
 * Get AI accuracy metrics for current user
 */
router.get('/accuracy', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const metrics = await aiFeedbackService.getAccuracyMetrics(userId);

    res.json({
      success: true,
      message: 'AI accuracy metrics',
      data: metrics
    });

  } catch (error) {
    console.error('[AI Routes] Accuracy error:', error.message);
    res.status(500).json({
      error: 'Failed to get accuracy metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/feedback-history
 * Get user's feedback history
 */
router.get('/feedback-history', authMiddleware, aiOperationRateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const history = await aiFeedbackService.getFeedbackHistory(userId, limit);

    res.json({
      success: true,
      message: 'Feedback history retrieved',
      data: {
        total: history.length,
        feedback: history
      }
    });

  } catch (error) {
    console.error('[AI Routes] History error:', error.message);
    res.status(500).json({
      error: 'Failed to get feedback history',
      message: error.message
    });
  }
});

module.exports = router;
