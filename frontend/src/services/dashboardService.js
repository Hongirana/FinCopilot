import apiClient from './apiClient';

/**
 * Dashboard Service
 * Handles all API calls for dashboard data
 */

// Get dashboard summary statistics
export const getDashboardStats = async () => {
    try {
        const response = await apiClient.get('/dashboard/stats');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

// Get all accounts with balances
export const getAccounts = async () => {
    try {
        const response = await apiClient.get('/accounts');
        console.log('Fetched accounts:', response.data);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
    }
};

// Get recent transactions (limit 5-10)
export const getRecentTransactions = async (limit = 5) => {
    try {
        const response = await apiClient.get('/transactions', {
            params: {
                limit,
                sortBy: 'date',
                sortOrder: 'desc'
            }
        });
        console.log('Fetched recent transactions:', response);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        throw error;
    }
};

// Get transaction summary (income/expense totals for current month)
export const getTransactionSummary = async (startDate, endDate) => {
    try {
        const response = await apiClient.get('/transactions/summary', {
            params: { startDate, endDate }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching transaction summary:', error);
        throw error;
    }
};

// Calculate dashboard statistics from accounts and transactions
export const calculateDashboardStats = (accounts, transactions) => {
    // 1. Calculate total balance across all accounts
    const transactionsList = transactions.transactions || [];
    const accountsList = accounts.accounts || [];
    console.log('Calculating dashboard stats with accounts:', accountsList);
    const totalBalance = accountsList.length > 0 ? accountsList.reduce((sum, account) => {
        return sum + parseFloat(account.balance || 0);
    }, 0) : 0;
    
    // 2. Get current month and previous month date ranges
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth, 0);

    // 3. Filter transactions by month
    const currentMonthTransactions = transactionsList.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= currentMonthStart && txnDate <= currentMonthEnd;
    });

    const previousMonthTransactions = transactionsList.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= previousMonthStart && txnDate <= previousMonthEnd;
    });

    // 4. Calculate current month income and expenses
    const currentIncome = currentMonthTransactions
        .filter(txn => txn.type === 'INCOME')
        .reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);

    const currentExpenses = currentMonthTransactions
        .filter(txn => txn.type === 'EXPENSE')
        .reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);

    // 5. Calculate previous month income and expenses
    const previousIncome = previousMonthTransactions
        .filter(txn => txn.type === 'INCOME')
        .reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);

    const previousExpenses = previousMonthTransactions
        .filter(txn => txn.type === 'EXPENSE')
        .reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);

    // 6. Calculate savings
    const currentSavings = currentIncome - currentExpenses;
    const previousSavings = previousIncome - previousExpenses;

    // 7. Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) {
            return current > 0 ? '+100%' : '0%';
        }
        const change = ((current - previous) / previous) * 100;
        const formatted = Math.abs(change).toFixed(1);
        return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
    };

    const balanceChange = calculatePercentageChange(totalBalance, totalBalance * 0.9); // Mock previous balance
    const incomeChange = calculatePercentageChange(currentIncome, previousIncome);
    const expenseChange = calculatePercentageChange(currentExpenses, previousExpenses);
    const savingsChange = calculatePercentageChange(currentSavings, previousSavings);

    // 8. Get account breakdown
    const accountBreakdown = accountsList.map(account => ({
        id: account.id,
        name: account.accountName,
        type: account.accountType,
        balance: parseFloat(account.balance || 0)
    }));

    // 9. Get top spending categories (current month)
    const categorySpending = {};
    currentMonthTransactions
        .filter(txn => txn.type === 'EXPENSE')
        .forEach(txn => {
            const category = txn.category || 'Other';
            categorySpending[category] = (categorySpending[category] || 0) + parseFloat(txn.amount || 0);
        });

    const topCategories = Object.entries(categorySpending)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    // 10. Return comprehensive stats
    return {
        totalBalance,
        income: currentIncome,
        expenses: currentExpenses,
        savings: currentSavings,
        balanceChange,
        incomeChange,
        expenseChange,
        savingsChange,
        accountBreakdown,
        topCategories,
        transactionCount: {
            current: currentMonthTransactions.length,
            previous: previousMonthTransactions.length
        },
        averageTransaction: currentMonthTransactions.length > 0
            ? (currentIncome + currentExpenses) / currentMonthTransactions.length
            : 0
    };
};

export default {
    getDashboardStats,
    getAccounts,
    getRecentTransactions,
    getTransactionSummary,
    calculateDashboardStats
};
