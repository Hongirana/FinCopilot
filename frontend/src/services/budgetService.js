import apiClient from './apiClient';

// ============================================
// API CALLS
// ============================================

// Get all budgets with optional filters
export const getBudgets = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.period) params.append('period', filters.period);
        if (filters.category) params.append('category', filters.category);
        if (filters.active !== undefined) params.append('active', filters.active);

        const response = await apiClient.get(`/budgets?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching budgets:', error);
        throw error;
    }
};

// Get a single budget by ID
export const getBudgetById = async (id) => {
    try {
        const response = await apiClient.get(`/budgets/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching budget:', error);
        throw error;
    }
};

// Create a new budget
export const createBudget = async (budgetData) => {
    try {
        const response = await apiClient.post('/budgets', budgetData);
        return response.data;
    } catch (error) {
        console.error('Error creating budget:', error);
        throw error;
    }
};

// Update an existing budget
export const updateBudget = async (id, budgetData) => {
    try {
        const response = await apiClient.put(`/budgets/${id}`, budgetData);
        return response.data;
    } catch (error) {
        console.error('Error updating budget:', error);
        throw error;
    }
};

// Delete a budget
export const deleteBudget = async (id) => {
    try {
        const response = await apiClient.delete(`/budgets/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting budget:', error);
        throw error;
    }
};

// Get budget alerts (over-budget or near limit)
export const getBudgetAlerts = async (threshold = 80) => {
    try {
        const response = await apiClient.get(`/budgets/alerts?threshold=${threshold}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching budget alerts:', error);
        throw error;
    }
};

// Recalculate all budgets
export const recalculateBudgets = async () => {
    try {
        const response = await apiClient.post('/budgets/recalculate');
        return response.data;
    } catch (error) {
        console.error('Error recalculating budgets:', error);
        throw error;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get budget periods (must match backend enum)
export const getBudgetPeriods = () => {
    return ['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM'];
};

// Format period for display
export const getPeriodLabel = (period) => {
    const labels = {
        MONTHLY: 'Monthly',
        WEEKLY: 'Weekly',
        YEARLY: 'Yearly',
        CUSTOM: 'Custom'
    };
    return labels[period] || period;
};

// Get period emoji
export const getPeriodEmoji = (period) => {
    const emojis = {
        MONTHLY: '📅',
        WEEKLY: '📆',
        YEARLY: '🗓️',
        CUSTOM: '⚙️'
    };
    return emojis[period] || '📊';
};

// Calculate budget status color
export const getBudgetStatusColor = (percentSpent) => {
    const percent = parseFloat(percentSpent);

    if (percent >= 100) {
        return 'red'; // Over budget
    } else if (percent >= 80) {
        return 'yellow'; // Warning
    } else if (percent >= 50) {
        return 'blue'; // Normal
    } else {
        return 'green'; // Good
    }
};

// Get progress bar color classes
export const getProgressBarColor = (percentSpent) => {
    const percent = parseFloat(percentSpent);

    if (percent >= 100) {
        return 'bg-red-500';
    } else if (percent >= 80) {
        return 'bg-yellow-500';
    } else if (percent >= 50) {
        return 'bg-blue-500';
    } else {
        return 'bg-green-500';
    }
};

// Get status badge
export const getStatusBadge = (budget) => {
    if (budget.isOverBudget) {
        return {
            label: 'Over Budget',
            color: 'bg-red-100 text-red-800',
            icon: '⚠️'
        };
    } else if (parseFloat(budget.percentSpent) >= 80) {
        return {
            label: 'Near Limit',
            color: 'bg-yellow-100 text-yellow-800',
            icon: '⚡'
        };
    } else {
        return {
            label: 'On Track',
            color: 'bg-green-100 text-green-800',
            icon: '✓'
        };
    }
};

// Format date range
export const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    });
    const end = new Date(endDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    return `${start} - ${end}`;
};

// Calculate end date based on period
export const calculateEndDate = (startDate, period) => {
    const start = new Date(startDate);
    const end = new Date(start);

    switch (period) {
        case 'WEEKLY':
            end.setDate(start.getDate() + 7);
            break;
        case 'MONTHLY':
            end.setMonth(start.getMonth() + 1);
            break;
        case 'YEARLY':
            end.setFullYear(start.getFullYear() + 1);
            break;
        default:
            // CUSTOM - user will set manually
            break;
    }

    return end.toISOString().split('T')[0];
};
