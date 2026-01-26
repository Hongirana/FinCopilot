const { getMonthRange, getYearRange, getMonthName, getDaysInMonth, validateDateRange, validateDatetype } = require('./dateHelper');
const  prisma  = require('../prismaClient');

const genMonthlyReport = async (startDate, endDate, accountId, userId) => {
    const incomeData = await getIncomeOrExpense('credit', startDate, endDate, accountId, userId);
    const expenseData = await getIncomeOrExpense('debit', startDate, endDate, accountId, userId);

    const totalIncome = Number(incomeData._sum.amount || 0);
    const totalExpenses = Number(expenseData._sum.amount || 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

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

    return {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netSavings: netSavings.toFixed(2),
        savingsRate: savingsRate.toFixed(2),
        categoryBreakdown: categoryBreakdown
    };
}

const genPrevMonthReport = async (month, year, accountId, userId, totalExpenses) => {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
    }
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    const prevMonthExpenseResult = await getIncomeOrExpense('debit', prevStartDate, prevEndDate, accountId, userId);

    const prevExpenses = Number(prevMonthExpenseResult._sum.amount || 0);

    let change = 0;
    let changeAmount = 0;

    if (prevExpenses > 0) {
        changeAmount = totalExpenses - prevExpenses;
        change = (changeAmount / prevExpenses) * 100;
    }

    return {
        month: prevMonth,
        year: prevYear,
        prevYear: prevYear,
        prevExpenses: prevExpenses.toFixed(2),
        change: change.toFixed(2),
        changeAmount: changeAmount.toFixed(2)
    };
}

const getIncomeOrExpense = async (type, startDate, endDate, accountId, userId) => {
    const totalAmount = await prisma.transaction.aggregate({
        where: {
            userId: userId,
            ...(accountId && { accountId: accountId }),
            type: type,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            amount: true
        }
    });
    return totalAmount;
}

const getTrendbyPeriod = async (period, compare) => {
    const trends = [];
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    if (period === 'month') {
        for (let i = 0; i < compare; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = targetDate.getMonth() + 1;
            const year = targetDate.getFullYear();

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            trends.push({
                period: `${monthNames[month - 1]} ${year}`,
                startDate: startDate,
                endDate: endDate
            });
        }
    } else if (period === 'week') {
        for (let i = 0; i < compare; i++) {
            const weeksAgo = i * 7;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - weeksAgo);
            endDate.setHours(23, 59, 59, 999);

            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);

            trends.push({
                period: `Week of ${startDate.toISOString().split('T')[0]}`,
                startDate: startDate,
                endDate: endDate
            });
        }
    } else if (period === 'year') {
        for (let i = 0; i < compare; i++) {
            const year = now.getFullYear() - i;
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

            trends.push({
                period: `${year}`,
                startDate: startDate,
                endDate: endDate
            });
        }
    }

    return trends;
}

const categoryBreakDown = async (type, startDate, endDate, accountId, userId, limit) => {

    const categoryGroupedData = await prisma.transaction.groupBy({
        by: ['category'],
        where: {
            userId: userId,
            ...(accountId && { accountId: accountId }),
            type: type,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            amount: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                amount: 'desc'
            }
        },
        ...(limit && { take: limit })
    });

   

    return categoryGroupedData;
}

const genMonthlyBreakDownData = async (year, accountId, userId) => {
    const monthlyBreakDown = [];

    for (let month = 1; month <= 12; month++) {
        let monthstartDate = new Date(year, month - 1, 1);
        let monthendDate = new Date(year, month, 0, 23, 59, 59, 999);

        let monthExpenseData = await getIncomeOrExpense('debit', monthstartDate, monthendDate, accountId, userId);
        let monthIncomeData = await getIncomeOrExpense('credit', monthstartDate, monthendDate, accountId, userId);

        let monthlyExpenses = Number(monthExpenseData._sum.amount || 0);
        let monthlyIncome = Number(monthIncomeData._sum.amount || 0);

        let monthlySavings = monthlyIncome - monthlyExpenses;
        let monthlySavingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

        monthlyBreakDown.push({
            month: month,
            monthName: getMonthName(month),
            income: monthlyIncome.toFixed(2),
            expenses: monthlyExpenses.toFixed(2),
            savings: monthlySavings.toFixed(2),
            SavingPercentage: monthlySavingsRate.toFixed(2)
        });
    }
    return monthlyBreakDown;

}

const genQuarterlyBreakDownData = async (year, accountId, userId) => {
    const quarterlyBreakdown = [];

    for (let quarter = 1; quarter <= 4; quarter++) {
        // Calculate which months belong to this quarter
        const startMonth = (quarter - 1) * 3 + 1;  // Q1=1, Q2=4, Q3=7, Q4=10
        const endMonth = quarter * 3;               // Q1=3, Q2=6, Q3=9, Q4=12

        // Get start and end dates for quarter
        const qStartDate = new Date(year, startMonth - 1, 1);
        const qEndDate = new Date(year, endMonth, 0, 23, 59, 59, 999);

        const qIncomeResult = await getIncomeOrExpense('credit', qStartDate, qEndDate, accountId, userId);
        const qExpenseResult = await getIncomeOrExpense('debit', qStartDate, qEndDate, accountId, userId);

        const qIncome = Number(qIncomeResult._sum.amount || 0);
        const qExpenses = Number(qExpenseResult._sum.amount || 0);
        const qSavings = qIncome - qExpenses;
        const qSavingsRate = qIncome > 0 ? (qSavings / qIncome) * 100 : 0;

        const quarterMonths = getMonthName(startMonth) + ' - ' + getMonthName(endMonth);

        quarterlyBreakdown.push({
            quarter: quarter,
            months: quarterMonths,
            income: qIncome.toFixed(2),
            expenses: qExpenses.toFixed(2),
            savings: qSavings.toFixed(2),
            savingsRate: qSavingsRate.toFixed(2)
        });
    };

    return quarterlyBreakdown;
}


const validateandGetDate = async (startDate, endDate) => {
    //Validate Dates if exists
    const currentDate = new Date();
    const validateDate = async (date) => {
        if (date) {
            const isValid = await validateDatetype(date);
            if (!isValid) {
                return { isValid: false, message: 'Invalid Date Format' };
            }
        }
        return { isValid: true };
    };

    switch (true) {
        case !startDate && !endDate:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 31, 23, 59, 59, 59);
            break;
        case startDate && !endDate:
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 59);
            break;
        case !startDate && endDate:
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            break;
        default:
            break;
    }

    const startDateValidation = await validateDate(startDate);
    const endDateValidation = await validateDate(endDate);

    return { isValid: startDateValidation.isValid && endDateValidation.isValid, startDate, endDate };
}

function validateYear(year) {
    const minYear = 1900;
    const maxYear = 2100;
    if (year < minYear || year > maxYear) {
        return false;
    }
    return true;
}


module.exports = { 
    genMonthlyReport, 
    genPrevMonthReport, 
    genQuarterlyBreakDownData, 
    validateandGetDate, 
    validateYear, 
    genMonthlyBreakDownData, 
    categoryBreakDown,
    getTrendbyPeriod,
    getIncomeOrExpense 
};