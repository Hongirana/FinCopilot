import apiClient from './apiClient';

// ============================================
// API CALLS
// ============================================

// Get all goals with optional filters
export const getGoals = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.status) params.append('status', filters.status);
        if (filters.category) params.append('category', filters.category);

        const response = await apiClient.get(`/goals?${params.toString()}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching goals:', error);
        throw error;
    }
};

// Get goal statistics
export const getGoalStats = async () => {
    try {
        const response = await apiClient.get('/goals/stats');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching goal stats:', error);
        throw error;
    }
};

// Get a single goal by ID
export const getGoalById = async (id) => {
    try {
        const response = await apiClient.get(`/goals/${id}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching goal:', error);
        throw error;
    }
};

// Create a new goal
export const createGoal = async (goalData) => {
    try {
        const response = await apiClient.post('/goals', goalData);
        return response.data.data;
    } catch (error) {
        console.error('Error creating goal:', error);
        throw error;
    }
};

// Update goal details
export const updateGoal = async (id, goalData) => {
    try {
        const response = await apiClient.put(`/goals/${id}`, goalData);
        return response.data.data;
    } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
    }
};

// Update goal progress (add contribution)
export const updateGoalProgress = async (id, amount) => {
    try {
        const response = await apiClient.patch(`/goals/${id}/progress`, { amount });
        return response.data.data;
    } catch (error) {
        console.error('Error updating goal progress:', error);
        throw error;
    }
};

// Delete a goal
export const deleteGoal = async (id) => {
    try {
        const response = await apiClient.delete(`/goals/${id}`);
        return response.data.data;
    } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get goal statuses (must match backend enum)
export const getGoalStatuses = () => {
    return ['ACTIVE', 'COMPLETED', 'CANCELLED'];
};

// Get goal priorities
export const getGoalPriorities = () => {
    return ['low', 'medium', 'high'];
};

// Format status for display
export const getStatusLabel = (status) => {
    const labels = {
        ACTIVE: 'Active',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled'
    };
    return labels[status] || status;
};

// Format priority for display
export const getPriorityLabel = (priority) => {
    const labels = {
        low: 'Low',
        medium: 'Medium',
        high: 'High'
    };
    return labels[priority] || priority;
};

// Get status badge color
export const getStatusBadgeColor = (status) => {
    const colors = {
        ACTIVE: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get priority badge color
export const getPriorityBadgeColor = (priority) => {
    const colors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
};

// Get progress bar color
export const getProgressColor = (progressPercentage) => {
    const percent = parseFloat(progressPercentage);

    if (percent >= 100) {
        return 'bg-green-500';
    } else if (percent >= 75) {
        return 'bg-blue-500';
    } else if (percent >= 50) {
        return 'bg-yellow-500';
    } else if (percent >= 25) {
        return 'bg-orange-500';
    } else {
        return 'bg-red-500';
    }
};

// Get status icon
export const getStatusIcon = (status) => {
    const icons = {
        ACTIVE: '🎯',
        COMPLETED: '✅',
        CANCELLED: '❌'
    };
    return icons[status] || '📌';
};

// Get priority icon
export const getPriorityIcon = (priority) => {
    const icons = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
    };
    return icons[priority] || '⚪';
};

// Format deadline display
export const formatDeadline = (deadline, daysRemaining) => {
    const date = new Date(deadline).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    if (daysRemaining !== undefined) {
        if (daysRemaining < 0) {
            return `${date} (Overdue)`;
        } else if (daysRemaining === 0) {
            return `${date} (Today)`;
        } else if (daysRemaining === 1) {
            return `${date} (1 day left)`;
        } else {
            return `${date} (${daysRemaining} days left)`;
        }
    }

    return date;
};
