// Spending by Category

// Monthly Report

// Top Categories
const { successResponse, errorResponse } = require('../utils/responseHelper.js');
const { getMonthRange, getYearRange, getMonthName, getDaysInMonth, validateDateRange, validateDatetype } = require('../utils/dateHelper');
const {
    genMonthlyReport,
    genPrevMonthReport,
    genQuarterlyBreakDownData,
    validateandGetDate,
    validateYear,
    genMonthlyBreakDownData,
    categoryBreakDown,
    getTrendbyPeriod,
    getIncomeOrExpense
} = require('../utils/analyticsUtils.js');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');

const getSpendsByCategory =asyncHandler ( async (req, res) => {
    const { startDate, endDate, accountId } = req.query;
    const userId = req.user.id;
    
        const validDates = await validateandGetDate(startDate, endDate);
        if (!validDates.isValid && validDates.message) {
            throw new ValidationError(validDates.message);
        }

        validDates.startDate = new Date(validDates.startDate);
        validDates.endDate = new Date(validDates.endDate);

        if (validDates.startDate > validDates.endDate) {
            throw new ValidationError('Start date cannot be greater than end date');
        }

        const debitCategoryData = await categoryBreakDown('debit', validDates.startDate, validDates.endDate, accountId, userId);

        // Calculate total spending
        const totalSpending = debitCategoryData.reduce((sum, cat) => {
            return sum + Number(cat._sum.amount || 0);
        }, 0);

        // Transform data with percentages
        const categoryBreakdown = debitCategoryData.map(cat => {
            const amount = Number(cat._sum.amount || 0);
            const count = cat._count.id;
            const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
            const averageTransaction = count > 0 ? amount / count : 0;

            return {
                category: cat.category,
                amount: amount.toFixed(2),
                percentage: percentage.toFixed(2),
                transactionCount: count,
                averageTransaction: averageTransaction.toFixed(2)
            };
        });
        const incomeResult = await getIncomeOrExpense('credit', validDates.startDate, validDates.endDate, accountId, userId);
        const totalIncome = Number(incomeResult._sum.amount || 0);
        const netSavings = totalIncome - totalSpending;

        return successResponse(res, 200, 'Category spending fetched successfully', {
            period: {
                startDate: validDates.startDate.toISOString().split('T')[0],
                endDate: validDates.endDate.toISOString().split('T')[0]
            },
            totalSpending: totalSpending.toFixed(2),
            totalIncome: totalIncome.toFixed(2),
            netSavings: netSavings.toFixed(2),
            categoryBreakdown: categoryBreakdown
        });
})

const getMonthlyReport =asyncHandler( async (req, res) => {
    const userId = req.user.id;
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);
    const { accountId } = req.query;
    
        if (!month || !year) {
            throw new ValidationError('Provide month and year for report');
        }
        const isValidYear = validateYear(year);
        if (!isValidYear) {
            throw new ValidationError('Provide reasonable year for report');
        }

        if (month < 1 || month > 12) {
            throw new ValidationError('Provide reasonable month for report');
        }

        const dateRange = await getMonthRange(year, month);
        const monthName = await getMonthName(month);
        const daysInMonth = await getDaysInMonth(year, month);

        const monthlyReport = await genMonthlyReport(dateRange.startDate, dateRange.endDate, accountId, userId);

        const averageDailySpending = (monthlyReport.totalExpenses / daysInMonth).toFixed(2);

        const prevMonthReport = await genPrevMonthReport(month, year, accountId, userId, monthlyReport.totalExpenses);

        const prevMonth = prevMonthReport.prevMonth || 0;
        const prevYear = prevMonthReport.prevYear || 0;
        const prevExpenses = prevMonthReport.prevExpenses || 0;
        const change = prevMonthReport.change || 0;
        const changeAmount = prevMonthReport.changeAmount || 0;

        return successResponse(res, 200, 'Monthly report fetched successfully', {
            month: month,
            year: year,
            monthName: monthName,
            summary: {
                totalIncome: monthlyReport.totalIncome,
                totalExpenses: monthlyReport.totalExpenses,
                netSavings: monthlyReport.netSavings,
                savingsRate: monthlyReport.savingsRate
            },
            categoryBreakdown: monthlyReport.categoryBreakdown,
            dailyStats: {
                averageDailySpending: averageDailySpending,
                daysInMonth: daysInMonth
            },
            comparison: {
                previousMonth: {
                    month: prevMonth,
                    year: prevYear,
                    totalExpenses: prevExpenses.toFixed(2),
                    change: change.toFixed(2),
                    changeAmount: changeAmount.toFixed(2)
                }
            }
        });  
})

const getTopCategories =asyncHandler( async (req, res) => {
    
        const userId = req.user.id;
        let limit = parseInt(req.query.limit) || 5;

        // Validate limit
        if (limit < 1) limit = 5;
        if (limit > 20) limit = 20;

        const { startDate: queryStartDate, endDate: queryEndDate, accountId } = req.query;

        // Get date range (default to current month)
        let startDate, endDate;

        if (queryStartDate && queryEndDate) {
            startDate = new Date(queryStartDate);
            endDate = new Date(queryEndDate);
        } else {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59, 999);
        }

        // Query with groupBy
        const categoryData = await categoryBreakDown('debit', startDate, endDate, accountId, userId, limit);

        // Calculate total
        const totalSpending = categoryData.reduce((sum, cat) => {
            return sum + Number(cat._sum.amount || 0);
        }, 0);

        // Add rank and percentage
        const topCategories = categoryData.map((cat, index) => {
            const amount = Number(cat._sum.amount || 0);
            const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;

            return {
                rank: index + 1,
                category: cat.category,
                amount: amount.toFixed(2),
                percentage: percentage.toFixed(2),
                transactionCount: cat._count.id
            };
        });

        return successResponse(res, 200, 'Top categories fetched successfully', {
            period: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            },
            totalSpending: totalSpending.toFixed(2),
            topCategories: topCategories
        });    
});

const getYearlySummary =asyncHandler( async (req, res) => {
    const userId = req.user.id;
    const year = parseInt(req.query.year);
    const { accountId } = req.query;
    
        if (!year) {
            throw new ValidationError('Year is required');
        }

        const isValidYear = validateYear(year);

        if (!isValidYear) {
           throw new ValidationError('Provide reasonable year for report'); 
        }

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const yearIncomeData = await getIncomeOrExpense('credit', startDate, endDate, accountId, userId);
        const yearExpenseData = await getIncomeOrExpense('debit', startDate, endDate, accountId, userId);

        const totalIncome = Number(yearIncomeData._sum.amount || 0);
        const totalExpenses = Number(yearExpenseData._sum.amount || 0);
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        const monthlyBreakDown = await genMonthlyBreakDownData(year, accountId, userId);

        const topCategoriesData = await categoryBreakDown('debit', startDate, endDate, accountId, userId, 5);

        const topCategories = topCategoriesData.map(cat => {
            const amount = Number(cat._sum.amount || 0);
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

            return {
                category: cat.category,
                amount: amount.toFixed(2),
                percentage: percentage.toFixed(2)
            };
        });

        const quarterlyBreakdown = await genQuarterlyBreakDownData(year, accountId, userId);

        return successResponse(res, 200, 'Yearly summary fetched successfully', {
            year: year,
            summary: {
                totalIncome: totalIncome.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netSavings: netSavings.toFixed(2),
                savingsRate: savingsRate.toFixed(2)
            },
            monthlyBreakdown: monthlyBreakDown,
            topCategories: topCategories,
            quarterlyBreakdown: quarterlyBreakdown
        });
})

const getSpendingTrends =asyncHandler( async (req, res) => {
    
        const userId = req.user.id;
        const period = req.query.period;
        let compare = parseInt(req.query.compare) || 3;

        // Step 1: Validate
        if (!period || !['week', 'month', 'year'].includes(period)) {
            throw new ValidationError('Invalid period');
        }

        if (compare < 2) compare = 2;
        if (compare > 12) compare = 12;

        // Step 2: Calculate date ranges
        const trends = await getTrendbyPeriod(period, compare);

        // Step 3: Get expenses for each period
        for (let i = 0; i < trends.length; i++) {
            const expenseResult = await getIncomeOrExpense('debit', trends[i].startDate, trends[i].endDate, null, userId);
            trends[i].totalExpenses = Number(expenseResult._sum.amount || 0).toFixed(2);
        }

        // Step 4: Calculate changes and trends
        for (let i = 0; i < trends.length; i++) {
            if (i === trends.length - 1) {
                trends[i].changeFromPrevious = '0.00';
                trends[i].trend = 'baseline';
            } else {
                const current = parseFloat(trends[i].totalExpenses);
                const previous = parseFloat(trends[i + 1].totalExpenses);

                let change = 0;
                if (previous > 0) {
                    change = ((current - previous) / previous) * 100;
                }

                trends[i].changeFromPrevious = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);

                if (change > 5) {
                    trends[i].trend = 'increasing';
                } else if (change < -5) {
                    trends[i].trend = 'decreasing';
                } else {
                    trends[i].trend = 'stable';
                }
            }

            // Format dates for response
            trends[i].startDate = trends[i].startDate.toISOString().split('T')[0];
            trends[i].endDate = trends[i].endDate.toISOString().split('T')[0];
        }

        // Step 5: Overall trend
        let increasingCount = 0;
        let decreasingCount = 0;

        trends.forEach(t => {
            if (t.trend === 'increasing') increasingCount++;
            if (t.trend === 'decreasing') decreasingCount++;
        });

        let overallTrend = 'stable';
        if (increasingCount > decreasingCount) {
            overallTrend = 'increasing';
        } else if (decreasingCount > increasingCount) {
            overallTrend = 'decreasing';
        }

        const changes = trends.filter(t => t.trend !== 'baseline')
            .map(t => parseFloat(t.changeFromPrevious));
        const averageChange = changes.length > 0
            ? (changes.reduce((sum, c) => sum + c, 0) / changes.length).toFixed(2)
            : '0.00';

        return successResponse(res, 200, 'Spending trends fetched successfully', {
            period: period,
            periodsCompared: compare,
            trends: trends,
            overallTrend: overallTrend,
            averageChange: averageChange >= 0 ? `+${averageChange}` : averageChange
        });
});

const getDateRangeReport =asyncHandler( async (req, res) => {
    
        const userId = req.user.id;
        const { startDate: queryStartDate, endDate: queryEndDate, accountId } = req.query;

        // Step 1: Validate dates are provided
        if (!queryStartDate || !queryEndDate) {
            throw new ValidationError('Start date and end date are required');
        }

        const startDate = new Date(queryStartDate);
        const endDate = new Date(queryEndDate);

        // Validate start before end
        if (startDate > endDate) {
            throw new ValidationError('Start date cannot be greater than end date');
        }

        // Step 2: Calculate number of days
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;


        // Step 3: Get income and expenses
        const incomeResult = await getIncomeOrExpense('credit', startDate, endDate, accountId, userId);

        const totalIncome = Number(incomeResult._sum.amount || 0);

        const expenseResult = await getIncomeOrExpense('debit', startDate, endDate, accountId, userId);

        const totalExpenses = Number(expenseResult._sum.amount || 0);

        // Step 4: Calculate savings
        const netSavings = totalIncome - totalExpenses;
        const dailyAverage = (totalExpenses / days).toFixed(2);
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // Step 5: Get category breakdown
        const categoryData = await categoryBreakDown('debit', startDate, endDate, accountId, userId);

        const categoryBreakdown = categoryData.map(cat => {
            const amount = Number(cat._sum.amount || 0);
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

            return {
                category: cat.category,
                amount: amount.toFixed(2),
                percentage: percentage.toFixed(2)
            };
        });

        // Step 6: Return response
        return successResponse(res, 200, 'Date range report fetched successfully', {
            period: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                days: days
            },
            summary: {
                totalIncome: totalIncome.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netSavings: netSavings.toFixed(2),
                dailyAverage: dailyAverage,
                savingsRate: savingsRate.toFixed(2)
            },
            categoryBreakdown: categoryBreakdown
        }); 
});


module.exports = {
    getSpendsByCategory,
    getMonthlyReport,
    getTopCategories,
    getYearlySummary,
    getSpendingTrends,
    getDateRangeReport
};













