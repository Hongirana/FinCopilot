const prisma = require('../prismaClient');

class AIFeedbackService {
  /**
   * Record user feedback on AI categorization
   * @param {string} userId - User ID
   * @param {string} transactionId - Transaction ID
   * @param {string} suggestedCategory - Category AI suggested
   * @param {string} actualCategory - Category user corrected to
   * @param {number} confidence - AI's confidence score
   */
  async recordFeedback(userId, transactionId, suggestedCategory, actualCategory, confidence) {
    try {
      // Check if transaction exists and belongs to user
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId: userId
        }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Determine if AI was correct
      const isCorrect = suggestedCategory.toLowerCase() === actualCategory.toLowerCase();

      // Record feedback
      const feedback = await prisma.categoryFeedback.create({
        data: {
          userId,
          transactionId,
          suggestedCategory,
          actualCategory,
          confidence: parseFloat(confidence),
          isCorrect
        }
      });

      // Update transaction with correct category (if different)
      if (!isCorrect) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { category: actualCategory }
        });
      }
      return feedback;
    } catch (error) {
      console.error('[AIFeedback] Error recording feedback:', error.message);
      throw error;
    }
  }

  /**
   * Get AI accuracy metrics
   * @param {string} userId - User ID
   * @returns {Promise} Accuracy stats per category
   */
  async getAccuracyMetrics(userId) {
    try {
      // Get all feedback for user
      const allFeedback = await prisma.categoryFeedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (allFeedback.length === 0) {
        return {
          totalFeedback: 0,
          overallAccuracy: 0,
          byCategory: {}
        };
      }

      // Calculate overall accuracy
      const correctCount = allFeedback.filter(f => f.isCorrect).length;
      const overallAccuracy = (correctCount / allFeedback.length) * 100;

      // Calculate by category
      const byCategory = {};

      allFeedback.forEach(feedback => {
        const key = feedback.suggestedCategory;
        
        if (!byCategory[key]) {
          byCategory[key] = {
            total: 0,
            correct: 0,
            accuracy: 0,
            avgConfidence: 0
          };
        }

        byCategory[key].total += 1;
        if (feedback.isCorrect) byCategory[key].correct += 1;
      });

      // Calculate stats per category
      Object.keys(byCategory).forEach(category => {
        const stats = byCategory[category];
        stats.accuracy = (stats.correct / stats.total) * 100;
      });

      return {
        totalFeedback: allFeedback.length,
        overallAccuracy: Math.round(overallAccuracy * 100) / 100,
        byCategory,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('[AIFeedback] Error getting metrics:', error.message);
      throw error;
    }
  }

  /**
   * Get user's recent feedback history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   */
  async getFeedbackHistory(userId, limit = 20) {
    try {
      return await prisma.categoryFeedback.findMany({
        where: { userId },
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              amount: true,
              date: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('[AIFeedback] Error getting history:', error.message);
      throw error;
    }
  }
}

module.exports = new AIFeedbackService();
