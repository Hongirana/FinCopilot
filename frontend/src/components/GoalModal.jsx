import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
    getGoalPriorities,
    getPriorityLabel
} from '../services/goalService';
import {
    getCategories,
    getCategoryLabel,
    getCategoryIcon
} from '../services/transactionService';

const GoalModal = ({
    isOpen,
    onClose,
    onSubmit,
    goal,
    loading
}) => {
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetAmount: '',
        deadline: '',
        category: '',
        priority: 'medium'
    });

    const [errors, setErrors] = useState({});

    // Populate form when editing
    useEffect(() => {
        if (goal) {
            setFormData({
                title: goal.title || '',
                description: goal.description || '',
                targetAmount: goal.targetAmount || '',
                deadline: goal.deadline
                    ? new Date(goal.deadline).toISOString().split('T')[0]
                    : '',
                category: goal.category || '',
                priority: goal.priority || 'medium'
            });
        } else {
            // Reset form for new goal
            // Default deadline: 1 year from today
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            setFormData({
                title: '',
                description: '',
                targetAmount: '',
                deadline: oneYearFromNow.toISOString().split('T')[0],
                category: '',
                priority: 'medium'
            });
        }
        setErrors({});
    }, [goal, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Title validation
        if (!formData.title || !formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        // Target amount validation
        if (!formData.targetAmount) {
            newErrors.targetAmount = 'Target amount is required';
        } else if (isNaN(formData.targetAmount)) {
            newErrors.targetAmount = 'Target amount must be a number';
        } else if (parseFloat(formData.targetAmount) <= 0) {
            newErrors.targetAmount = 'Target amount must be greater than 0';
        }

        // Deadline validation
        if (!formData.deadline) {
            newErrors.deadline = 'Deadline is required';
        } else {
            const deadlineDate = new Date(formData.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (deadlineDate < today) {
                newErrors.deadline = 'Deadline must be in the future';
            }
        }

        // Category validation
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Prepare submit data (match backend expectations)
        const submitData = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            targetAmount: parseFloat(formData.targetAmount),
            deadline: formData.deadline,
            category: formData.category.toLowerCase(),
            priority: formData.priority.toLowerCase()
        };

        onSubmit(submitData);
    };

    const handleClose = () => {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        setFormData({
            title: '',
            description: '',
            targetAmount: '',
            deadline: oneYearFromNow.toISOString().split('T')[0],
            category: '',
            priority: 'medium'
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {goal ? 'Edit Goal' : 'Create Goal'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Goal Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Emergency Fund, Buy a Car, Dream Vacation"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add details about your goal..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>

                    {/* Target Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="targetAmount"
                            value={formData.targetAmount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        {errors.targetAmount && (
                            <p className="mt-1 text-sm text-red-500">{errors.targetAmount}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            How much do you want to save?
                        </p>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deadline <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.deadline ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        {errors.deadline && (
                            <p className="mt-1 text-sm text-red-500">{errors.deadline}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            When do you want to achieve this goal?
                        </p>
                    </div>

                    {/* Category and Priority Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.category ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={loading}
                            >
                                <option value="">Select</option>
                                {getCategories().filter(cat => cat !== 'uncategorized').map(cat => (
                                    <option key={cat} value={cat}>
                                        {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={loading}
                            >
                                {getGoalPriorities().map(priority => (
                                    <option key={priority} value={priority}>
                                        {getPriorityLabel(priority)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-blue-500 text-xl">💡</span>
                            </div>
                            <div className="ml-3">
                                <h4 className="text-sm font-medium text-blue-800">Tip</h4>
                                <p className="mt-1 text-sm text-blue-700">
                                    Break down large goals into smaller milestones. Track your progress regularly and adjust as needed!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                goal ? 'Update Goal' : 'Create Goal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalModal;
