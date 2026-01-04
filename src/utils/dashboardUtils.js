//Helper Functions
const prisma = require('../prismaClient');
const { getMonthRange, getMonthName } = require('../utils/dateHelper');
const { genMonthlyReport, genPrevMonthReport } = require('../utils/analyticsUtils.js');

const getBudgetOverview = async (userId, startDate, endDate) => {

    const budgets = await prisma.budget.findMany({
        where: {
            userId: userId,
            OR: [
                {
                    // Budget starts before or on endDate AND ends after or on startDate
                    AND: [
                        { startDate: { lte: endDate } },
                        { endDate: { gte: startDate } }
                    ]
                }
            ]
        }
    });

    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter(b => b.isActive).length;
    const totalBudgetAmount = budgets.reduce((sum, b) => sum + Number(b.amount), 0);

    // Calculate total spent for budgeted categories
    let totalSpent = 0;
    for (const budget of budgets) {
        const spent = await prisma.transaction.aggregate({
            where: {
                userId: userId,
                type: 'debit',
                category: budget.category,
                date: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true }
        });
        totalSpent += Number(spent._sum.amount || 0);
    }

    const remainingBudget = totalBudgetAmount - totalSpent;
    const budgetUtilization = totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

    return {
        totalBudgets: totalBudgets,
        activeBudgets: activeBudgets,
        totalBudgetAmount: totalBudgetAmount.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        remainingBudget: remainingBudget.toFixed(2),
        budgetUtilization: budgetUtilization.toFixed(2)
    };

}


const getAccountsSummary = async (userId) => {
    const accounts = await prisma.account.findMany({
        where: { userId: userId },
        select: {
            id: true,
            name: true,
            type: true,
            balance: true
        }
    });

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    return {
        totalAccounts: accounts.length,
        totalBalance: totalBalance.toFixed(2),
        accounts: accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            balance: Number(acc.balance).toFixed(2)
        }))
    };
};

const getGoalsOverview = async (userId) => {
    const goals = await prisma.goal.findMany({
        where: { userId: userId }
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    const totalTargetAmount = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
        totalGoals: totalGoals,
        activeGoals: activeGoals,
        completedGoals: completedGoals,
        totalTargetAmount: totalTargetAmount.toFixed(2),
        totalCurrentAmount: totalCurrentAmount.toFixed(2),
        overallProgress: overallProgress.toFixed(2)
    };
};


const calculateNetWorth = async (userId) => {
    // Get all accounts
    const accounts = await prisma.account.findMany({
        where: { userId: userId }
    });

    // Separate assets and liabilities
    let assets = 0;
    let liabilities = 0;

    accounts.forEach(account => {
        const balance = Number(account.balance);
        if (balance >= 0) {
            assets += balance;
        } else {
            liabilities += Math.abs(balance);
        }
    });

    const total = assets - liabilities;

    return {
        total: total.toFixed(2),
        breakdown: {
            assets: assets.toFixed(2),
            liabilities: liabilities.toFixed(2)
        }
    };
};


const calculateCashFlow = async (userId) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get total inflow
    const inflowResult = await prisma.transaction.aggregate({
        where: {
            userId: userId,
            type: 'credit',
            date: { gte: thirtyDaysAgo, lte: now }
        },
        _sum: { amount: true }
    });

    // Get total outflow
    const outflowResult = await prisma.transaction.aggregate({
        where: {
            userId: userId,
            type: 'debit',
            date: { gte: thirtyDaysAgo, lte: now }
        },
        _sum: { amount: true }
    });

    const totalInflow = Number(inflowResult._sum.amount || 0);
    const totalOutflow = Number(outflowResult._sum.amount || 0);
    const netCashFlow = totalInflow - totalOutflow;

    return {
        period: 'Last 30 days',
        totalInflow: totalInflow.toFixed(2),
        totalOutflow: totalOutflow.toFixed(2),
        netCashFlow: netCashFlow.toFixed(2)
    };
};

const calculateSpendingVelocity = async (userId) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get expenses for last 30 days
    const expenseResult = await prisma.transaction.aggregate({
        where: {
            userId: userId,
            type: 'debit',
            date: { gte: thirtyDaysAgo, lte: now }
        },
        _sum: { amount: true }
    });

    const totalExpenses = Number(expenseResult._sum.amount || 0);
    const dailyAverage = totalExpenses / 30;
    const weeklyAverage = dailyAverage * 7;
    const monthlyProjection = dailyAverage * 30;

    return {
        dailyAverage: dailyAverage.toFixed(2),
        weeklyAverage: weeklyAverage.toFixed(2),
        monthlyProjection: monthlyProjection.toFixed(2)
    };
};

const calculateSavingsMetrics = async (userId) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Current month savings
    const { startDate: currentStart, endDate: currentEnd } = getMonthRange(currentYear, currentMonth);
    const currentMonthData = await genMonthlyReport(currentStart, currentEnd, null, userId);

    // Last 3 months average
    let totalSavings = 0;
    let monthsData = [];

    for (let i = 0; i < 3; i++) {
        let month = currentMonth - i;
        let year = currentYear;

        while (month <= 0) {
            month += 12;
            year -= 1;
        }

        const { startDate, endDate } = getMonthRange(year, month);
        const monthData = await genMonthlyReport(startDate, endDate, null, userId);
        const savings = Number(monthData.netSavings);
        totalSavings += savings;
        monthsData.push(savings);
    }

    const averageSavings = totalSavings / 3;

    // Determine trend
    let trend = 'stable';
    if (monthsData.length >= 2) {
        const recent = monthsData[0];
        const older = monthsData[monthsData.length - 1];
        if (recent > older * 1.1) trend = 'increasing';
        else if (recent < older * 0.9) trend = 'decreasing';
    }

    return {
        currentMonthSavings: currentMonthData.netSavings,
        savingsRate: currentMonthData.savingsRate,
        last3MonthsAverage: averageSavings.toFixed(2),
        savingsTrend: trend
    };
};

// Helper 10: Get Top Expense Categories
const getTopExpenseCategories = async (userId) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { startDate, endDate } = getMonthRange(currentYear, currentMonth);

    // Get category breakdown
    const categoryData = await prisma.transaction.groupBy({
        by: ['category'],
        where: {
            userId: userId,
            type: 'debit',
            date: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        orderBy: {
            _sum: { amount: 'desc' }
        },
        take: 5
    });
    // Calculate total for percentages
    const totalExpenses = categoryData.reduce((sum, cat) => {
        return sum + Number(cat._sum.amount || 0);
    }, 0);

    return categoryData.map(cat => {
        const amount = Number(cat._sum.amount || 0);
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

        return {
            category: cat.category,
            amount: amount.toFixed(2),
            percentage: percentage.toFixed(2)
        };
    });
};

const getAccountsOverview = async (userId) => {
    const accounts = await prisma.account.findMany({
        where: { userId: userId }
    });
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    const accountTypes = accounts.reduce((counts, acc) => {
        counts[acc.type] = (counts[acc.type] || 0) + 1;
        return counts;
    }, {});

    return {
        totalAccounts: accounts.length,
        totalBalance: totalBalance.toFixed(2),
        accountTypes: accountTypes
    };
}

const getBudgetsQuickOverview = async (userId) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { startDate, endDate } = getMonthRange(currentYear, currentMonth);

    const allBudgets = await prisma.budget.findMany({
        where: { userId: userId }
    });

    const activeBudgets = allBudgets.filter(b => {
        if (b.period === 'MONTHLY') return true;
        if (b.period === 'CUSTOM') {
            return b.startDate <= endDate && b.endDate >= startDate;
        }
        return false;
    });

    // Check budgets near limit (>80% utilized)
    let budgetsNearLimit = 0;

    for (const budget of activeBudgets) {
        const spent = await prisma.transaction.aggregate({
            where: {
                userId: userId,
                type: 'debit',
                category: budget.category,
                date: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true }
        });

        const spentAmount = Number(spent._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const utilization = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

        if (utilization >= 80) {
            budgetsNearLimit++;
        }
    }

    return {
        totalBudgets: allBudgets.length,
        activeBudgets: activeBudgets.length,
        expiredBudgets: allBudgets.length - activeBudgets.length,
        budgetsNearLimit: budgetsNearLimit
    };
}

// 3. Goals Overview
const getGoalsQuickOverview = async (userId) => {
    const goals = await prisma.goal.findMany({
        where: { userId: userId }
    });

    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // Goals near target (>80% progress)
    const goalsNearTarget = goals.filter(g => {
        const progress = Number(g.targetAmount) > 0
            ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100
            : 0;
        return progress >= 80 && g.status === 'active';
    }).length;

    return {
        totalGoals: goals.length,
        activeGoals: activeGoals,
        completedGoals: completedGoals,
        goalsNearTarget: goalsNearTarget
    };
}

// 4. Transactions Overview
const getTransactionsOverview = async (userId) => {
    const now = new Date();

    // Total transactions
    const totalCount = await prisma.transaction.count({
        where: { userId: userId }
    });

    // This month
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { startDate: monthStart, endDate: monthEnd } = getMonthRange(currentYear, currentMonth);

    const thisMonthCount = await prisma.transaction.count({
        where: {
            userId: userId,
            date: { gte: monthStart, lte: monthEnd }
        }
    });

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekCount = await prisma.transaction.count({
        where: {
            userId: userId,
            date: { gte: weekStart, lte: now }
        }
    });

    // Today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayCount = await prisma.transaction.count({
        where: {
            userId: userId,
            date: { gte: todayStart, lte: todayEnd }
        }
    });

    return {
        totalTransactions: totalCount,
        thisMonth: thisMonthCount,
        thisWeek: thisWeekCount,
        today: todayCount
    };
}

// 5. Recent Transactions (Last 5)
const getRecentTransactions = async (userId, limit) => {
    const transactions = await prisma.transaction.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' },
        take: limit,
        select: {
            id: true,
            type: true,
            category: true,
            amount: true,
            description: true,
            date: true
        }
    });

    return transactions.map(txn => ({
        id: txn.id,
        type: txn.type,
        category: txn.category,
        amount: Number(txn.amount).toFixed(2),
        description: txn.description,
        date: txn.date.toISOString()
    }));
}


const generateAlerts = async (userId) => {
    const alerts = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { startDate, endDate } = getMonthRange(currentYear, currentMonth);

    // Check budget alerts
    const budgets = await prisma.budget.findMany({
        where: {
            userId: userId,
            OR: [
                { period: 'MONTHLY' },
                {
                    period: 'CUSTOM',
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                }
            ]
        }
    });

    for (const budget of budgets) {
        const spent = await prisma.transaction.aggregate({
            where: {
                userId: userId,
                type: 'debit',
                category: budget.category,
                date: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true }
        });

        const spentAmount = Number(spent._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const utilization = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

        if (utilization >= 90) {
            alerts.push({
                type: 'budget_critical',
                message: `${budget.category} budget is ${utilization.toFixed(0)}% utilized`,
                severity: 'critical'
            });
        } else if (utilization >= 80) {
            alerts.push({
                type: 'budget_warning',
                message: `${budget.category} budget is ${utilization.toFixed(0)}% utilized`,
                severity: 'warning'
            });
        }
    }

    // Check goal milestones
    const goals = await prisma.goal.findMany({
        where: { userId: userId, status: 'ACTIVE' }
    });

    for (const goal of goals) {
        const progress = Number(goal.targetAmount) > 0
            ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
            : 0;

        // Milestone alerts at 25%, 50%, 75%, 90%
        const milestones = [25, 50, 75, 90];
        for (const milestone of milestones) {
            if (progress >= milestone && progress < milestone + 5) {
                alerts.push({
                    type: 'goal_milestone',
                    message: `${goal.name} reached ${milestone}% of target`,
                    severity: 'info'
                });
            }
        }
    }

    return alerts;
};


module.exports = {
    getBudgetOverview,
    getGoalsOverview,
    getAccountsSummary,
    calculateSpendingVelocity,
    calculateSavingsMetrics,
    getTopExpenseCategories,
    calculateCashFlow,
    calculateNetWorth,
    getAccountsOverview,
    getBudgetsQuickOverview,
    getGoalsQuickOverview,
    getTransactionsOverview,
    getRecentTransactions,
    generateAlerts
};