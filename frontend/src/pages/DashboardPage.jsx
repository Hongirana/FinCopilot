import { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { getAccounts, getRecentTransactions, calculateDashboardStats } from '../services/dashboardService';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  // State management
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Show loading toast
      const loadingToast = toast.loading('Loading dashboard data...');

      // Fetch accounts and transactions in parallel
      const [accountsData, transactionsData] = await Promise.all([
        getAccounts(),
        getRecentTransactions(5)
      ]);

      // Calculate statistics
      const calculatedStats = calculateDashboardStats(
        accountsData.data || accountsData,
        transactionsData.data || transactionsData
      );

      setStats(calculatedStats);
      setRecentTransactions(transactionsData.data || transactionsData);
      setLastUpdated(new Date());

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('Dashboard updated!', {
        duration: 2000,
        icon: '✅'
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Set user-friendly error message
      let errorMessage = 'Failed to load dashboard data';
      
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date with smart display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  // Get transaction type badge styling
  const getTransactionBadge = (type) => {
    if (type === 'INCOME') {
      return {
        icon: ArrowUpIcon,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        iconColor: 'text-green-600'
      };
    } else {
      return {
        icon: ArrowDownIcon,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        iconColor: 'text-red-600'
      };
    }
  };

  // Get category emoji
  const getCategoryEmoji = (category) => {
    const categoryMap = {
      'Food & Dining': '🍔',
      'Shopping': '🛍️',
      'Transportation': '🚗',
      'Bills & Utilities': '💡',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Education': '📚',
      'Salary': '💰',
      'Investment': '📈',
      'Business': '💼',
      'Other': '📝'
    };
    return categoryMap[category] || '💵';
  };

  // Get time ago for last updated
  const getTimeAgo = (date) => {
    if (!date) return '';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleDateString('en-IN');
  };

  // Enhanced Loading State with Skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Insights Skeleton */}
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced Error State
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Error Message */}
          <h3 className="text-xl font-bold text-red-900 mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-red-700 mb-6">
            {error || 'Something went wrong while fetching your financial data.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/accounts'}
              className="inline-flex items-center px-6 py-3 bg-white text-red-600 font-medium rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors"
            >
              Go to Accounts
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-red-600 mt-6">
            If the problem persists, please contact support or try logging out and back in.
          </p>
        </div>
      </div>
    );
  }

  // Empty State (No Data)
  if (!loading && !error && (!stats || stats.totalBalance === 0)) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-8 text-center">
          {/* Welcome Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Welcome Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to FinCopilot! 🎉
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You're all set! Let's start tracking your finances by adding your first account and transaction.
          </p>

          {/* Getting Started Steps */}
          <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Start Guide:
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Add Your First Account</p>
                  <p className="text-xs text-gray-600 mt-1">Savings, checking, credit card, or cash</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Record Your First Transaction</p>
                  <p className="text-xs text-gray-600 mt-1">Income, expenses, or transfers</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Set Up Your Budget</p>
                  <p className="text-xs text-gray-600 mt-1">Track spending by category</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/accounts'}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Account
            </button>
            
            <button
              onClick={() => window.location.href = '/transactions'}
              className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Add Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stat cards configuration with real data
  const statCards = [
    {
      name: 'Total Balance',
      value: formatCurrency(stats?.totalBalance || 0),
      change: stats?.balanceChange || '+0%',
      changeType: 'positive',
      icon: WalletIcon,
    },
    {
      name: 'Income (This Month)',
      value: formatCurrency(stats?.income || 0),
      change: stats?.incomeChange || '+0%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Expenses (This Month)',
      value: formatCurrency(stats?.expenses || 0),
      change: stats?.expenseChange || '+0%',
      changeType: 'negative',
      icon: ArrowTrendingDownIcon,
    },
    {
      name: 'Savings',
      value: formatCurrency(stats?.savings || 0),
      change: stats?.savingsChange || '+0%',
      changeType: stats?.savings > 0 ? 'positive' : 'negative',
      icon: BanknotesIcon,
    },
  ];

  return (
    <div>
      {/* Page Header with Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Here's what's happening with your finances today
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {getTimeAgo(lastUpdated)}
            </p>
          )}
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh dashboard data"
        >
          <svg 
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600"> from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Insights Section */}
      {stats && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Transaction Count */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                    Transactions
                  </p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">
                    {stats.transactionCount?.current || 0}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    This month
                  </p>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Top Spending Category */}
            {stats.topCategories && stats.topCategories.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                      Top Category
                    </p>
                    <p className="text-sm font-bold text-purple-900 mt-1 truncate">
                      {stats.topCategories[0].category}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {formatCurrency(stats.topCategories[0].amount)}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {getCategoryEmoji(stats.topCategories[0].category)}
                  </div>
                </div>
              </div>
            )}

            {/* Savings Rate */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                    Savings Rate
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {stats.income > 0 
                      ? ((stats.savings / stats.income) * 100).toFixed(1) 
                      : '0.0'}%
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Of total income
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Transaction */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                    Avg Transaction
                  </p>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    {formatCurrency(stats.averageTransaction || 0)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Per transaction
                  </p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Accounts Overview */}
      {stats && stats.accountBreakdown && stats.accountBreakdown.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Accounts</h2>
            <button 
              onClick={() => window.location.href = '/accounts'}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Manage Accounts
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.accountBreakdown.map((account) => (
              <div 
                key={account.id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {account.type}
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {account.name}
                </h3>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(account.balance)}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {((account.balance / stats.totalBalance) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>
            {recentTransactions.length > 0 && (
              <button 
                onClick={() => window.location.href = '/transactions'}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All
              </button>
            )}
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const badge = getTransactionBadge(transaction.type);
                const BadgeIcon = badge.icon;
                
                return (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    {/* Left side - Icon and Details */}
                    <div className="flex items-center space-x-3">
                      {/* Category Emoji */}
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-xl">
                        {getCategoryEmoji(transaction.category)}
                      </div>
                      
                      {/* Transaction Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {transaction.category}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Amount with Badge */}
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${badge.textColor}`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <div className={`p-1 ${badge.bgColor} rounded-full`}>
                        <BadgeIcon className={`w-3 h-3 ${badge.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <BanknotesIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No transactions yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Start tracking your finances by adding your first transaction
              </p>
              <button 
                onClick={() => window.location.href = '/transactions'}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add Transaction
              </button>
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Budget Overview
          </h2>
          <p className="text-sm text-gray-500">
            Budget data coming in Day 26.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
