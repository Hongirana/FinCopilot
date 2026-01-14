/**
 * Advanced Analytics Utility Functions
 * Enhancement to existing analyticsUtils with advanced metrics
 */

const prisma = require('../prismaClient');

/**
 * Calculate spending forecast (Linear regression)
 */
const forecastSpending = (historicalData) => {
  if (historicalData.length < 2) {
    return { forecast: null, message: 'Insufficient data' };
  }

  // Simple linear regression
  const n = historicalData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  historicalData.forEach((item, index) => {
    const x = index;
    const y = parseFloat(item.amount);
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Forecast next period
  const nextPeriod = n;
  const forecast = slope * nextPeriod + intercept;

  return {
    forecast: Math.max(0, forecast).toFixed(2),
    slope: slope.toFixed(2),
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
  };
};

/**
 * Calculate budget health score (0-100)
 */
const calculateBudgetHealthScore = async (userId) => {
  const budgets = await prisma.budget.findMany({
    where: { userId }
  });

  if (budgets.length === 0) return 100;

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const spending = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      type: 'debit',
      date: { gte: currentMonth }
    },
    _sum: { amount: true }
  });

  const spendingMap = spending.reduce((acc, item) => {
    acc[item.category] = item._sum.amount || 0;
    return acc;
  }, {});

  let totalOverage = 0;
  let totalBudget = 0;

  budgets.forEach(budget => {
    const spent = spendingMap[budget.category] || 0;
    totalBudget += parseFloat(budget.amount);
    
    if (spent > parseFloat(budget.amount)) {
      totalOverage += spent - parseFloat(budget.amount);
    }
  });

  const healthScore = totalBudget > 0 
    ? Math.max(0, 100 - (totalOverage / totalBudget) * 100)
    : 100;

  return parseFloat(healthScore.toFixed(2));
};

/**
 * Calculate financial health index (0-100)
 * Based on multiple factors
 */
const calculateFinancialHealthIndex = async (userId) => {
  const metrics = {
    savingsRate: 0,      // 0-30 points
    budgetAdherence: 0,  // 0-30 points
    goalProgress: 0,     // 0-20 points
    debtToIncome: 0      // 0-20 points
  };

  // Get last 3 months data
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [transactions, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo }
      },
      select: { type: true, amount: true }
    }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } })
  ]);

  // Metric 1: Savings Rate (Income - Expense) / Income * 100
  const totalIncome = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  metrics.savingsRate = Math.min(30, Math.max(0, savingsRate * 0.3)); // 30% of savings possible

  // Metric 2: Budget Adherence
  const budgetHealthScore = await calculateBudgetHealthScore(userId);
  metrics.budgetAdherence = budgetHealthScore * 0.3; // 30% of total

  // Metric 3: Goal Progress
  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  if (activeGoals.length > 0) {
    const avgProgress = activeGoals.reduce((sum, g) => 
      sum + (g.currentAmount / g.targetAmount) * 100, 0
    ) / activeGoals.length;
    metrics.goalProgress = Math.min(20, avgProgress * 0.2);
  } else {
    metrics.goalProgress = 15; // Default bonus if no goals
  }

  // Metric 4: Debit/Credit Ratio
  if (totalIncome > 0) {
    const ratio = totalExpense / totalIncome;
    const debtScore = ratio <= 0.7 ? 20 : ratio <= 0.9 ? 15 : ratio <= 1 ? 10 : 0;
    metrics.debtToIncome = debtScore;
  }

  const totalScore = Object.values(metrics).reduce((sum, v) => sum + v, 0);
  
  return {
    overallScore: parseFloat(totalScore.toFixed(2)),
    metrics: {
      savingsRate: parseFloat(metrics.savingsRate.toFixed(2)),
      budgetAdherence: parseFloat(metrics.budgetAdherence.toFixed(2)),
      goalProgress: parseFloat(metrics.goalProgress.toFixed(2)),
      expenseToIncomeRatio: parseFloat(metrics.debtToIncome.toFixed(2))
    },
    rating: totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Needs Improvement'
  };
};

/**
 * Get anomaly detection (unusual spending patterns)
 */
const detectAnomalies = async (userId, months = 3) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'debit',
      date: { gte: startDate }
    },
    select: {
      amount: true,
      category: true,
      description: true,
      date: true
    }
  });

  const anomalies = [];

  // Group by category
  const byCategory = {};
  transactions.forEach(tx => {
    if (!byCategory[tx.category]) {
      byCategory[tx.category] = [];
    }
    byCategory[tx.category].push(parseFloat(tx.amount));
  });

  // Find outliers using 2 standard deviations
  Object.entries(byCategory).forEach(([category, amounts]) => {
    if (amounts.length < 3) return;

    const mean = amounts.reduce((a, b) => a + b) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;

    transactions
      .filter(t => t.category === category && parseFloat(t.amount) > threshold)
      .forEach(tx => {
        anomalies.push({
          date: tx.date,
          category: tx.category,
          description: tx.description,
          amount: tx.amount.toFixed(2),
          threshold: threshold.toFixed(2),
          severity: 'high'
        });
      });
  });

  return anomalies;
};

/**
 * Compare with historical average
 */
const compareWithAverage = async (userId, category, currentAmount, months = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const historicalData = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      category,
      type: 'debit',
      date: { gte: startDate }
    },
    _avg: { amount: true },
    _sum: { amount: true },
    _count: { id: true }
  });

  if (historicalData.length === 0) {
    return { comparison: 'No historical data' };
  }

  const data = historicalData[0];
  const average = parseFloat(data._avg.amount || 0);
  const total = parseFloat(data._sum.amount || 0);
  const count = data._count.id;

  const difference = parseFloat(currentAmount) - average;
  const percentChange = average > 0 ? (difference / average) * 100 : 0;

  return {
    category,
    current: parseFloat(currentAmount).toFixed(2),
    historicalAverage: average.toFixed(2),
    difference: difference.toFixed(2),
    percentChange: parseFloat(percentChange.toFixed(2)),
    trend: difference > 0 ? 'above average' : difference < 0 ? 'below average' : 'on average',
    historicalTotal: total.toFixed(2),
    transactionCount: count,
    period: `${months} months`
  };
};

module.exports = {
  forecastSpending,
  calculateBudgetHealthScore,
  calculateFinancialHealthIndex,
  detectAnomalies,
  compareWithAverage
};
