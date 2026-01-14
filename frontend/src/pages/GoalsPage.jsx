import { useState, useEffect } from 'react';
import {
    getGoals,
    deleteGoal,
    getGoalStats,
    getGoalStatuses,
    createGoal,
    updateGoal,
    updateGoalProgress,
    getStatusLabel,
    getStatusBadgeColor,
    getStatusIcon,
    getPriorityLabel,
    getPriorityBadgeColor,
    getPriorityIcon,
    getProgressColor,
    formatDeadline
} from '../services/goalService';
import {
    getCategories,
    getCategoryLabel,
    getCategoryIcon
} from '../services/transactionService';
import toast from 'react-hot-toast';
import GoalModal from '../components/GoalModal';
import ProgressModal from '../components/ProgressModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';


const GoalsPage = () => {
    // State Management
    const [goals, setGoals] = useState([]);
    const [filteredGoals, setFilteredGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter States
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingGoal, setDeletingGoal] = useState(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [updatingGoal, setUpdatingGoal] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch goals and stats
    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const [goalsData, statsData] = await Promise.all([
                getGoals(),
                getGoalStats()
            ]);

            setGoals(goalsData.goals || goalsData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load goals. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        filterGoals();
    }, [goals, filterStatus, filterCategory]);

    const filterGoals = () => {
        let filtered = [...goals];

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(goal => goal.status === filterStatus);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(goal => goal.category === filterCategory);
        }

        setFilteredGoals(filtered);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deletingGoal) return;

        try {
            setModalLoading(true);
            await deleteGoal(deletingGoal.id);

            setGoals(prev => prev.filter(g => g.id !== deletingGoal.id));
            setShowDeleteModal(false);
            setDeletingGoal(null);

            toast.success('Goal deleted successfully!');
            await fetchData(); // Refresh stats
        } catch (err) {
            console.error('Error deleting goal:', err);
            toast.error(err.response?.data?.message || 'Failed to delete goal.');
        } finally {
            setModalLoading(false);
        }
    };

    // Handle goal submit (create or update)
    const handleGoalSubmit = async (goalData) => {
        try {
            setModalLoading(true);

            if (editingGoal) {
                // Update existing goal
                await updateGoal(editingGoal.id, goalData);
                toast.success('Goal updated successfully!');
            } else {
                // Create new goal
                await createGoal(goalData);
                toast.success('Goal created successfully!');
            }

            // Refresh data
            await fetchData();

            // Close modal
            setShowModal(false);
            setEditingGoal(null);
        } catch (err) {
            console.error('Error saving goal:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save goal. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    // Handle progress update
    const handleProgressUpdate = async (amount) => {
        if (!updatingGoal) return;

        try {
            setModalLoading(true);
            const response = await updateGoalProgress(updatingGoal.id, amount);

            // Check if goal was completed
            const message = response.message || 'Progress updated successfully!';

            if (message.includes('Congratulations') || message.includes('achieved')) {
                toast.success('🎉 ' + message, { duration: 5000 });
            } else {
                toast.success(message);
            }

            // Refresh data
            await fetchData();

            // Close modal
            setShowProgressModal(false);
            setUpdatingGoal(null);
        } catch (err) {
            console.error('Error updating progress:', err);
            const errorMessage = err.response?.data?.message || 'Failed to update progress. Please try again.';
            toast.error(errorMessage);
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
                    <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
                    <p className="text-gray-600 mt-1">Track your savings and financial objectives</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGoal(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Create Goal
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Summary Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Goals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Goals</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-2">
                                    {stats.totalGoals}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Goals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                    {stats.activeGoals}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🚀</span>
                            </div>
                        </div>
                    </div>

                    {/* Completed Goals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                    {stats.completedGoals}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                                <p className="text-2xl font-bold text-purple-600 mt-2">
                                    {stats.overallProgress}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatCurrency(stats.totalSavedAmount)} / {formatCurrency(stats.totalTargetAmount)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📈</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Statuses</option>
                            {getGoalStatuses().map(status => (
                                <option key={status} value={status}>
                                    {getStatusIcon(status)} {getStatusLabel(status)}
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

            {/* Goals Grid */}
            {filteredGoals.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No goals found</h3>
                    <p className="text-gray-600 mb-4">
                        {filterStatus !== 'all' || filterCategory !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first financial goal to start tracking progress'}
                    </p>
                    {filterStatus === 'all' && filterCategory === 'all' && (
                        <button
                            onClick={() => {
                                setEditingGoal(null);
                                setShowModal(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            + Create Goal
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGoals.map((goal) => {
                        const progressBarColor = getProgressColor(goal.progressPercentage);
                        const percentWidth = Math.min(parseFloat(goal.progressPercentage), 100);

                        return (
                            <div
                                key={goal.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                            >
                                {/* Card Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {goal.title}
                                            </h3>
                                            {goal.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {goal.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(goal.status)}`}>
                                            {getStatusIcon(goal.status)} {getStatusLabel(goal.status)}
                                        </span>
                                        {goal.priority && (
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(goal.priority)}`}>
                                                {getPriorityIcon(goal.priority)} {getPriorityLabel(goal.priority)}
                                            </span>
                                        )}
                                        {goal.category && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {getCategoryIcon(goal.category)} {getCategoryLabel(goal.category)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    {/* Amount Display */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-sm text-gray-600">Current</span>
                                            <span className="text-sm text-gray-600">Target</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(goal.currentAmount)}
                                            </span>
                                            <span className="text-lg text-gray-500">
                                                / {formatCurrency(goal.targetAmount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-gray-600">{goal.progressPercentage}%</span>
                                            <span className="text-xs text-gray-600">
                                                {formatCurrency(goal.remaining || 0)} left
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`${progressBarColor} h-2.5 rounded-full transition-all duration-300`}
                                                style={{ width: `${percentWidth}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    <div className="text-xs text-gray-500 mb-4">
                                        📅 Deadline: {formatDeadline(goal.deadline, goal.daysRemaining)}
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {goal.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => {
                                                    setUpdatingGoal(goal);
                                                    setShowProgressModal(true);
                                                }}
                                                className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                            >
                                                + Add
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditingGoal(goal);
                                                setShowModal(true);
                                            }}
                                            className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeletingGoal(goal);
                                                setShowDeleteModal(true);
                                            }}
                                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
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
            {/* Goal Modal (Create/Edit) */}
            {showModal && (
                <GoalModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditingGoal(null);
                    }}
                    onSubmit={handleGoalSubmit}
                    goal={editingGoal}
                    loading={modalLoading}
                />
            )}

            {/* Progress Modal (Add Contribution) */}
            {showProgressModal && (
                <ProgressModal
                    isOpen={showProgressModal}
                    onClose={() => {
                        setShowProgressModal(false);
                        setUpdatingGoal(null);
                    }}
                    onSubmit={handleProgressUpdate}
                    goal={updatingGoal}
                    loading={modalLoading}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeletingGoal(null);
                    }}
                    onConfirm={handleDelete}
                    title="Delete Goal"
                    message={`Are you sure you want to delete "${deletingGoal?.title}"? This action cannot be undone.`}
                    loading={modalLoading}
                />
            )}

        </div>
    );
};

export default GoalsPage;
