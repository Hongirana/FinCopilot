import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
    getBudgetPeriods,
    getPeriodLabel,
    calculateEndDate
} from '../services/budgetService';
import {
    getCategories,
    getCategoryLabel,
    getCategoryIcon
} from '../services/transactionService';

const BudgetModal = ({
    isOpen,
    onClose,
    onSubmit,
    budget,
    loading
}) => {
    // Form state
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        period: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    const [errors, setErrors] = useState({});

    // Populate form when editing
    useEffect(() => {
        if (budget) {
            setFormData({
                category: budget.category || '',
                amount: budget.amount || '',
                period: budget.period || 'MONTHLY',
                startDate: budget.startDate
                    ? new Date(budget.startDate).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                endDate: budget.endDate
                    ? new Date(budget.endDate).toISOString().split('T')[0]
                    : ''
            });
        } else {
            // Reset form for new budget
            const today = new Date().toISOString().split('T')[0];
            const monthEnd = calculateEndDate(today, 'MONTHLY');

            setFormData({
                category: '',
                amount: '',
                period: 'MONTHLY',
                startDate: today,
                endDate: monthEnd
            });
        }
        setErrors({});
    }, [budget, isOpen]);

    // Auto-calculate end date when period or start date changes
    useEffect(() => {
        if (formData.period !== 'CUSTOM' && formData.startDate) {
            const calculatedEndDate = calculateEndDate(formData.startDate, formData.period);
            setFormData(prev => ({
                ...prev,
                endDate: calculatedEndDate
            }));
        }
    }, [formData.period, formData.startDate]);

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

        // Category validation
        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }

        // Amount validation
        if (!formData.amount) {
            newErrors.amount = 'Amount is required';
        } else if (isNaN(formData.amount)) {
            newErrors.amount = 'Amount must be a number';
        } else if (parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        // Period validation
        if (!formData.period) {
            newErrors.period = 'Please select a period';
        }

        // Start date validation
        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        // End date validation
        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        } else if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            if (end <= start) {
                newErrors.endDate = 'End date must be after start date';
            }
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
            category: formData.category.toLowerCase(), // Backend expects lowercase
            amount: parseFloat(formData.amount),
            period: formData.period.toUpperCase(), // Backend expects uppercase
            startDate: formData.startDate,
            endDate: formData.endDate
        };

        onSubmit(submitData);
    };

    const handleClose = () => {
        const today = new Date().toISOString().split('T')[0];
        const monthEnd = calculateEndDate(today, 'MONTHLY');

        setFormData({
            category: '',
            amount: '',
            period: 'MONTHLY',
            startDate: today,
            endDate: monthEnd
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
                        {budget ? 'Edit Budget' : 'Create Budget'}
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
                    {/* Category Selection */}
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
                            <option value="">Select Category</option>
                            {getCategories().filter(cat => cat !== 'uncategorized').map(cat => (
                                <option key={cat} value={cat}>
                                    {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Choose the category you want to set a spending limit for
                        </p>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Budget Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        {errors.amount && (
                            <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Maximum amount you want to spend in this period
                        </p>
                    </div>

                    {/* Period Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Period <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="period"
                            value={formData.period}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.period ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        >
                            {getBudgetPeriods().map(period => (
                                <option key={period} value={period}>
                                    {getPeriodLabel(period)}
                                </option>
                            ))}
                        </select>
                        {errors.period && (
                            <p className="mt-1 text-sm text-red-500">{errors.period}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.period === 'CUSTOM'
                                ? 'Set custom start and end dates below'
                                : 'End date will be calculated automatically'}
                        </p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={loading}
                            />
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                            )}
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                min={formData.startDate}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={loading || formData.period !== 'CUSTOM'}
                            />
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-blue-500 text-xl">ℹ️</span>
                            </div>
                            <div className="ml-3">
                                <h4 className="text-sm font-medium text-blue-800">How it works</h4>
                                <p className="mt-1 text-sm text-blue-700">
                                    Your spending for this category will be tracked automatically based on your transactions.
                                    You'll receive alerts when you approach or exceed your budget limit.
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
                                budget ? 'Update Budget' : 'Create Budget'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetModal;
