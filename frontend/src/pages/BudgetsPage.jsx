import { useState, useEffect } from 'react';
import {
    getBudgets,
    deleteBudget,
    getBudgetAlerts,
    getBudgetPeriods,
    createBudget,
    updateBudget,
    getPeriodLabel,
    getPeriodEmoji,
    getProgressBarColor,
    getStatusBadge,
    formatDateRange
} from '../services/budgetService';
import {
    getCategories,
    getCategoryLabel,
    getCategoryIcon
} from '../services/transactionService';
import toast from 'react-hot-toast';
import BudgetModal from '../components/BudgetModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const BudgetsPage = () => {
    // State Management
    const [budgets, setBudgets] = useState([]);
    const [filteredBudgets, setFilteredBudgets] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter States
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingBudget, setDeletingBudget] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalBudgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        overBudgetCount: 0
    });

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch budgets and alerts
    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const [budgetsData, alertsData] = await Promise.all([
                getBudgets({ active: showActiveOnly }),
                getBudgetAlerts(80)
            ]);

            setBudgets(budgetsData.budgets || budgetsData || []);
            setAlerts(alertsData.alerts || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load budgets. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        filterBudgets();
    }, [budgets, filterPeriod, filterCategory, showActiveOnly]);

    const filterBudgets = () => {
        let filtered = [...budgets];

        // Apply period filter
        if (filterPeriod !== 'all') {
            filtered = filtered.filter(budget => budget.period === filterPeriod);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(budget => budget.category === filterCategory);
        }

        // Apply active filter
        if (showActiveOnly) {
            const now = new Date();
            filtered = filtered.filter(budget =>
                new Date(budget.startDate) <= now && new Date(budget.endDate) >= now
            );
        }

        setFilteredBudgets(filtered);
        calculateStats(filtered);
    };

    // Calculate statistics
    const calculateStats = (budgetList) => {
        const totalAllocated = budgetList.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const totalSpent = budgetList.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0);
        const overBudgetCount = budgetList.filter(b => b.isOverBudget).length;

        setStats({
            totalBudgets: budgetList.length,
            totalAllocated,
            totalSpent,
            overBudgetCount
        });
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deletingBudget) return;

        try {
            setModalLoading(true);
            await deleteBudget(deletingBudget.id);

            setBudgets(prev => prev.filter(b => b.id !== deletingBudget.id));
            setShowDeleteModal(false);
            setDeletingBudget(null);

            toast.success('Budget deleted successfully!');
        } catch (err) {
            console.error('Error deleting budget:', err);
            toast.error(err.response?.data?.message || 'Failed to delete budget.');
        } finally {
            setModalLoading(false);
        }
    };

    // Handle budget submit (create or update)
    const handleBudgetSubmit = async (budgetData) => {
        try {
            setModalLoading(true);

            if (editingBudget) {
                // Update existing budget
                await updateBudget(editingBudget.id, budgetData);
                toast.success('Budget updated successfully!');
            } else {
                // Create new budget
                await createBudget(budgetData);
                toast.success('Budget created successfully!');
            }

            // Refresh data
            await fetchData();

            // Close modal
            setShowModal(false);
            setEditingBudget(null);
        } catch (err) {
            console.error('Error saving budget:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save budget. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };


    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
                    <p className="text-gray-600 mt-1">Track and manage your spending limits</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBudget(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Create Budget
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Budget Alerts ({alerts.length})
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <ul className="list-disc list-inside space-y-1">
                                    {alerts.slice(0, 3).map(alert => (
                                        <li key={alert.id}>
                                            <span className="font-medium">{getCategoryLabel(alert.category)}</span>
                                            {' - '}
                                            {alert.isOverBudget
                                                ? `Over budget by ${formatCurrency(parseFloat(alert.spent) - parseFloat(alert.amount))}`
                                                : `${alert.percentSpent}% spent`
                                            }
                                        </li>
                                    ))}
                                    {alerts.length > 3 && (
                                        <li className="text-yellow-600">+ {alerts.length - 3} more alerts</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Budgets */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Budgets</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-2">
                                {stats.totalBudgets}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                </div>

                {/* Total Allocated */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                            <p className="text-2xl font-bold text-blue-600 mt-2">
                                {formatCurrency(stats.totalAllocated)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                {formatCurrency(stats.totalSpent)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💸</span>
                        </div>
                    </div>
                </div>

                {/* Over Budget Count */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Over Budget</p>
                            <p className={`text-2xl font-bold mt-2 ${stats.overBudgetCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {stats.overBudgetCount}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.overBudgetCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                            <span className="text-2xl">{stats.overBudgetCount > 0 ? '⚠️' : '✅'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Period Filter */}
                    <div>
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Periods</option>
                            {getBudgetPeriods().map(period => (
                                <option key={period} value={period}>
                                    {getPeriodEmoji(period)} {getPeriodLabel(period)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Categories</option>
                            {getCategories().map(cat => (
                                <option key={cat} value={cat}>
                                    {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Active Only Toggle */}
                    <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showActiveOnly}
                                onChange={(e) => setShowActiveOnly(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active Budgets Only</span>
                        </label>
                    </div>

                    {/* Refresh Button */}
                    <div>
                        <button
                            onClick={fetchData}
                            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Budgets Grid */}
            {filteredBudgets.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
                    <p className="text-gray-600 mb-4">
                        {filterPeriod !== 'all' || filterCategory !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first budget to start tracking spending'}
                    </p>
                    {filterPeriod === 'all' && filterCategory === 'all' && (
                        <button
                            onClick={() => {
                                setEditingBudget(null);
                                setShowModal(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            + Create Budget
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBudgets.map((budget) => {
                        const statusBadge = getStatusBadge(budget);
                        const progressBarColor = getProgressBarColor(budget.percentSpent);
                        const percentWidth = Math.min(parseFloat(budget.percentSpent), 100);

                        return (
                            <div key={budget.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                {/* Card Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getCategoryIcon(budget.category)}</span>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {getCategoryLabel(budget.category)}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {getPeriodEmoji(budget.period)} {getPeriodLabel(budget.period)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                            {statusBadge.icon} {statusBadge.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    {/* Amount Display */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-sm text-gray-600">Spent</span>
                                            <span className="text-sm text-gray-600">Budget</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(budget.spent)}
                                            </span>
                                            <span className="text-lg text-gray-500">
                                                / {formatCurrency(budget.amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-gray-600">{budget.percentSpent}%</span>
                                            <span className="text-xs text-gray-600">
                                                {formatCurrency(budget.remaining || 0)} left
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`${progressBarColor} h-2.5 rounded-full transition-all duration-300`}
                                                style={{ width: `${percentWidth}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div className="text-xs text-gray-500 mb-4">
                                        📅 {formatDateRange(budget.startDate, budget.endDate)}
                                        {budget.daysRemaining !== undefined && budget.daysRemaining >= 0 && (
                                            <span className="ml-2">
                                                ({budget.daysRemaining} {budget.daysRemaining === 1 ? 'day' : 'days'} left)
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingBudget(budget);
                                                setShowModal(true);
                                            }}
                                            className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeletingBudget(budget);
                                                setShowDeleteModal(true);
                                            }}
                                            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals placeholders - will implement in Block C */}
            {/* Budget Modal (Add/Edit) */}
            {showModal && (
                <BudgetModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditingBudget(null);
                    }}
                    onSubmit={handleBudgetSubmit}
                    budget={editingBudget}
                    loading={modalLoading}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeletingBudget(null);
                    }}
                    onConfirm={handleDelete}
                    title="Delete Budget"
                    message={`Are you sure you want to delete the budget for ${deletingBudget ? getCategoryLabel(deletingBudget.category) : 'this category'}? This action cannot be undone.`}
                    loading={modalLoading}
                />
            )}

        </div>
    );
};

export default BudgetsPage;
