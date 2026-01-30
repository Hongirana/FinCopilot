import apiClient from './apiClient';

/**
 * Account Service
 * Handles all API calls for account management
 * Matches backend Prisma schema (lowercase enum values)
 */

// Get all accounts for current user
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

// Get single account by ID
export const getAccountById = async (accountId) => {
  try {
    const response = await apiClient.get(`/accounts/${accountId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
};

// Create new account
export const createAccount = async (accountData) => {
  try {
    const response = await apiClient.post('/accounts', accountData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

// Update existing account
export const updateAccount = async (accountId, accountData) => {
  try {
    const response = await apiClient.put(`/accounts/${accountId}`, accountData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

// Delete account
export const deleteAccount = async (accountId) => {
  try {
    const response = await apiClient.delete(`/accounts/${accountId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// Get account types - matches Prisma enum exactly (lowercase)
export const getAccountTypes = () => {
  return [
    'savings',
    'checking',
    'credit_card',
    'investment',
    'cash'
  ];
};

// Get account type display name - handles lowercase from backend
export const getAccountTypeDisplay = (type) => {
  const typeMap = {
    'savings': 'Savings Account',
    'checking': 'Checking Account',
    'credit_card': 'Credit Card',
    'investment': 'Investment Account',
    'cash': 'Cash'
  };
  return typeMap[type] || type;
};

// Get account type emoji - handles lowercase from backend
export const getAccountTypeEmoji = (type) => {
  const emojiMap = {
    'savings': '💰',
    'checking': '🏦',
    'credit_card': '💳',
    'investment': '📈',
    'cash': '💵'
  };
  return emojiMap[type] || '💼';
};

export default {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTypes,
  getAccountTypeDisplay,
  getAccountTypeEmoji
};
