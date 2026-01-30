import apiClient from './apiClient';

// Get all transactions with optional filters
export const getTransactions = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.accountId) params.append('accountId', filters.accountId);
        if (filters.type) params.append('type', filters.type);
        if (filters.category) params.append('category', filters.category);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);

        const response = await apiClient.get(`/transactions?${params.toString()}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

// Get a single transaction by ID
export const getTransactionById = async (id) => {
    try {
        const response = await apiClient.get(`/transactions/${id}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching transaction:', error);
        throw error;
    }
};

// Create a new transaction
export const createTransaction = async (transactionData) => {
    try {
        const response = await apiClient.post('/transactions', transactionData);
        return response.data.data;
    } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
    }
};

// Update an existing transaction
export const updateTransaction = async (id, transactionData) => {
    try {
        const response = await apiClient.put(`/transactions/${id}`, transactionData);
        return response.data.data;
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
};

// Delete a transaction
export const deleteTransaction = async (id) => {
    try {
        const response = await apiClient.delete(`/transactions/${id}`);
        return response.data.data;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
};

// Helper: Get transaction types (credit/debit)
export const getTransactionTypes = () => {
    return ['credit', 'debit'];
};

// Get all valid categories (aligned with backend enum)
export const getCategories = () => {
  return [
    'food',
    'transport',
    'utilities',
    'entertainment',
    'shopping',
    'medical',
    'rent',
    'insurance',
    'education',
    'salary',
    'savings',
    'other',
    'uncategorized'
  ];
};

// Helper: Format category for display (capitalize)
export const getCategoryLabel = (category) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1);
};

// Helper: Format transaction type for display
export const getTransactionTypeLabel = (type) => {
    const labels = {
        credit: 'Credit',
        debit: 'Debit'
    };
    return labels[type] || type;
};

// Helper: Get type badge color
export const getTypeBadgeColor = (type) => {
    return type === 'credit'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
};

// Helper: Get category icon/emoji (optional enhancement)
export const getCategoryIcon = (category) => {
    const icons = {
        food: '🍔',
        rent: '🏠',
        utilities: '💡',
        transport: '🚗',
        entertainment: '🎬',
        shopping: '🛍️',
        medical: '⚕️',
        insurance: '🛡️',
        education: '📚',
        savings: '💰',
        salary: '💵',
        other: '📌',
        uncategorized: '❓'
    };
    return icons[category] || '📌';
};

// Get category color for badges/chips
export const getCategoryColor = (category) => {
  const colors = {
    food: 'bg-orange-100 text-orange-800',
    transport: 'bg-blue-100 text-blue-800',
    utilities: 'bg-yellow-100 text-yellow-800',
    entertainment: 'bg-purple-100 text-purple-800',
    shopping: 'bg-pink-100 text-pink-800',
    medical: 'bg-red-100 text-red-800',
    rent: 'bg-indigo-100 text-indigo-800',
    insurance: 'bg-teal-100 text-teal-800',
    education: 'bg-cyan-100 text-cyan-800',
    salary: 'bg-green-100 text-green-800',
    savings: 'bg-emerald-100 text-emerald-800',
    other: 'bg-gray-100 text-gray-800',
    uncategorized: 'bg-gray-100 text-gray-600'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};