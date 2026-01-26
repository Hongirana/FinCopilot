const advancedAnalyticsUtils = require('../utils/advancedAnalyticsUtils');
const prisma = require('../prismaClient');

/**
 * Get Budget Health Score
 * GET /api/advanced-analytics/health-score
 */
async function getHealthScore(req, res) {
  try {
    const userId = req.user.id;

    

    // Call your utility function
    const healthScore = await advancedAnalyticsUtils.calculateBudgetHealthScore(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Budget health score calculated successfully',
      data: {
        healthScore,
        rating: healthScore >= 80 ? 'Excellent' 
              : healthScore >= 60 ? 'Good' 
              : healthScore >= 40 ? 'Fair' 
              : 'Needs Improvement'
      }
    });
  } catch (error) {
    console.error('[AdvancedAnalytics] Health Score Error:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to calculate health score',
      error: error.message
    });
  }
}

/**
 * Get Financial Health Index
 * GET /api/advanced-analytics/financial-index
 */
async function getFinancialIndex(req, res) {
  try {
    const userId = req.user.id;

    

    // Call your utility function
    const result = await advancedAnalyticsUtils.calculateFinancialHealthIndex(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Financial health index calculated successfully',
      data: result
    });
  } catch (error) {
    console.error('[AdvancedAnalytics] Financial Index Error:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to calculate financial index',
      error: error.message
    });
  }
}

/**
 * Detect Anomalies in Transactions
 * GET /api/advanced-analytics/anomalies?months=3
 */
async function detectAnomalies(req, res) {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 3;

    

    // Call your utility function
    const anomalies = await advancedAnalyticsUtils.detectAnomalies(userId, months);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Anomalies detected successfully',
      data: {
        anomalyCount: anomalies.length,
        anomalies
      }
    });
  } catch (error) {
    console.error('[AdvancedAnalytics] Anomaly Detection Error:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to detect anomalies',
      error: error.message
    });
  }
}

/**
 * Get Spending Forecast
 * GET /api/advanced-analytics/forecast
 */
async function getSpendingForecast(req, res) {
  try {
    const userId = req.user.id;

   

    // Get last 6 months of spending data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalData = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        type: 'debit',
        date: { gte: sixMonthsAgo }
      },
      _sum: { amount: true }
    });

    // Format data for forecasting
    const formattedData = historicalData.map(item => ({
      category: item.category,
      amount: item._sum.amount || 0
    }));

    // Call your forecast function
    const forecast = advancedAnalyticsUtils.forecastSpending(formattedData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Spending forecast generated successfully',
      data: {
        forecast,
        historicalData: formattedData
      }
    });
  } catch (error) {
    console.error('[AdvancedAnalytics] Forecast Error:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to generate forecast',
      error: error.message
    });
  }
}

/**
 * Compare with Historical Average
 * GET /api/advanced-analytics/compare?category=food&amount=5000&months=12
 */
async function compareWithAverage(req, res) {
  try {
    const userId = req.user.id;
    const { category, amount, months = 12 } = req.query;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Category and amount are required'
      });
    }

    // Call your utility function
    const comparison = await advancedAnalyticsUtils.compareWithAverage(
      userId, 
      category, 
      parseFloat(amount), 
      parseInt(months)
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comparison completed successfully',
      data: comparison
    });
  } catch (error) {
    console.error('[AdvancedAnalytics] Compare Error:', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to compare with average',
      error: error.message
    });
  }
}

module.exports = {
  getHealthScore,
  getFinancialIndex,
  detectAnomalies,
  getSpendingForecast,
  compareWithAverage
};
