const prisma = require('../prismaClient');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { genMonthlyReport, genPrevMonthReport } = require('../utils/analyticsUtils.js');
const {
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
} = require('../utils/dashboardUtils');
const { getMonthRange, getMonthName } = require('../utils/dateHelper');

const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');


const getDashboardSummary = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthRange = await getMonthRange(year, month);
    const startDate = monthRange.startDate
    const endDate = monthRange.endDate;
    const monthName = await getMonthName(month);

    // Helper 1: Current Month Summary
    const currentMonthData = await genMonthlyReport(startDate, endDate, null, userId);
    // Helper 2: Previous Month Comparison
    const prevMonthReport = await genPrevMonthReport(month, year, null, userId, currentMonthData.totalExpenses);
    // 3. Budget Overview
    const budgetOverview = await getBudgetOverview(userId, startDate, endDate);

    // 4. Goals Overview
    const goalsOverview = await getGoalsOverview(userId);

    // 5. Accounts Summary
    const accountsSummary = await getAccountsSummary(userId);

    const summary = {
        currentMonth: {
            month: month,
            year: year,
            monthName: monthName,
            ...currentMonthData
        },
        previousMonth: prevMonthReport,
        budgetOverview: budgetOverview,
        goalsOverview: goalsOverview,
        accounts: accountsSummary
    };

    return successResponse(res, 200, 'Dashboard summary fetched successfully', {
        summary: summary
    });
})

const getFinancialStats = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    // 1. Net Worth Calculation
    const netWorth = await calculateNetWorth(userId);

    // 2. Cash Flow (Last 30 days)
    const cashFlow = await calculateCashFlow(userId);

    // 3. Spending Velocity
    const spendingVelocity = await calculateSpendingVelocity(userId);

    // 4. Savings Metrics
    const savingsMetrics = await calculateSavingsMetrics(userId);

    // 5. Top Expense Categories (Current Month)
    const topExpenseCategories = await getTopExpenseCategories(userId);

    const financialStats = {
        netWorth: netWorth,
        cashFlow: cashFlow,
        spendingVelocity: spendingVelocity,
        savingsMetrics: savingsMetrics,
        topExpenseCategories: topExpenseCategories
    }

    return successResponse(res, 200, 'Financial stats fetched successfully', { financialStats: financialStats });
});

const getQuickOverview = asyncHandler(async (req, res) => {

    const userId = req.user.id;
    // 1. Accounts Overview
    const accountsOverview = await getAccountsOverview(userId);

    // 2. Budgets Overview
    const budgetsOverview = await getBudgetsQuickOverview(userId);

    // 3. Goals Overview
    const goalsQuickOverview = await getGoalsQuickOverview(userId);

    // 4. Transactions Overview
    const transactionsOverview = await getTransactionsOverview(userId);

    // 5. Recent Transactions (Last 5)
    const recentTransactions = await getRecentTransactions(userId, 5);

    // 6. Alerts & Notifications
    const alerts = await generateAlerts(userId);

    return successResponse(res, 200, 'Dashboard overview fetched successfully', {
        accountsOverview: accountsOverview,
        budgetsOverview: budgetsOverview,
        goalsOverview: goalsQuickOverview,
        transactionsOverview: transactionsOverview,
        recentTransactions: recentTransactions,
        alerts: alerts
    });
})


module.exports = {
    getDashboardSummary,
    getFinancialStats,
    getQuickOverview
};


