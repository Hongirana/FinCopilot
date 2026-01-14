import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
    getCategories,
    getCategoryLabel,
    getCategoryIcon,
    getTransactionTypes,
    getTransactionTypeLabel
} from '../services/transactionService';


const TransactionModal = ({
    isOpen,
    onClose,
    onSubmit,
    transaction,
    accounts,
    loading
}) => {
    // Form state
    const [formData, setFormData] = useState({
        accountId: '',
        amount: '',
        type: 'debit',
        category: 'auto', // Default to AI auto-categorization
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0] // Today's date
    });

    const [errors, setErrors] = useState({});


    // Populate form when editing
    useEffect(() => {
        if (transaction) {
            setFormData({
                accountId: transaction.accountId || transaction.account?.id || '',
                amount: transaction.amount || '',
                type: transaction.type || 'debit',
                category: transaction.category || 'auto',
                merchant: transaction.merchant || '',
                description: transaction.description || '',
                date: transaction.date
                    ? new Date(transaction.date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
            });
        } else {
            // Reset form for new transaction
            setFormData({
                accountId: accounts.length > 0 ? accounts[0].id : '',
                amount: '',
                type: 'debit',
                category: 'auto',
                merchant: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
        setErrors({});
    }, [transaction, isOpen, accounts]);

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

        // Account validation
        if (!formData.accountId) {
            newErrors.accountId = 'Please select an account';
        }

        // Amount validation
        if (!formData.amount) {
            newErrors.amount = 'Amount is required';
        } else if (isNaN(formData.amount)) {
            newErrors.amount = 'Amount must be a number';
        } else if (parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        // Type validation
        if (!formData.type) {
            newErrors.type = 'Please select transaction type';
        }

        // Description validation
        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 3) {
            newErrors.description = 'Description must be at least 3 characters';
        }

        // Date validation
        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (selectedDate > today) {
                newErrors.date = 'Date cannot be in the future';
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

        // Prepare submit data
        const submitData = {
            accountId: formData.accountId,
            amount: parseFloat(formData.amount),
            type: formData.type,
            merchant: formData.merchant.trim() || null,
            description: formData.description.trim(),
            date: new Date(formData.date).toISOString()
        };

        // Hybrid AI Categorization:
        // If "auto" selected -> don't send category (backend will AI categorize)
        // If manual category -> send the selected category
        if (formData.category !== 'auto') {
            submitData.category = formData.category;
        }

        onSubmit(submitData);
    };

    const handleClose = () => {
        setFormData({
            accountId: accounts.length > 0 ? accounts[0].id : '',
            amount: '',
            type: 'debit',
            category: 'auto',
            merchant: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setErrors({});
        onClose();
    };

    // Get account name helper
    const getAccountName = (account) => {
        return account.name || account.accountName || 'Unknown Account';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {transaction ? 'Edit Transaction' : 'Add Transaction'}
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
                    {/* Account Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="accountId"
                            value={formData.accountId}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.accountId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        >
                            <option value="">Select Account</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {getAccountName(account)} - {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        minimumFractionDigits: 0
                                    }).format(account.balance)}
                                </option>
                            ))}
                        </select>
                        {errors.accountId && (
                            <p className="mt-1 text-sm text-red-500">{errors.accountId}</p>
                        )}
                    </div>

                    {/* Type and Amount Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Transaction Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={loading}
                            >
                                {getTransactionTypes().map(type => (
                                    <option key={type} value={type}>
                                        {getTransactionTypeLabel(type)}
                                    </option>
                                ))}
                            </select>
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-500">{errors.type}</p>
                            )}
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₹) <span className="text-red-500">*</span>
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
                        </div>
                    </div>

                    {/* Category - Hybrid AI Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="auto">🤖 Auto-Categorize (AI)</option>
                            <option disabled>───────────────────</option>
                            {getCategories().map(cat => (
                                <option key={cat} value={cat}>
                                    {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.category === 'auto'
                                ? '✨ AI will automatically categorize based on description and merchant'
                                : '👤 You selected a manual category'}
                        </p>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        {errors.date && (
                            <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                        )}
                    </div>

                    {/* Merchant */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Merchant
                        </label>
                        <input
                            type="text"
                            name="merchant"
                            value={formData.merchant}
                            onChange={handleChange}
                            placeholder="e.g., Swiggy, Amazon, HDFC Bank"
                            maxLength="100"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Optional: Helps AI categorize more accurately
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g., Lunch at office, Monthly rent payment, Salary credit"
                            rows="3"
                            maxLength="255"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            disabled={loading}
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.description.length}/255 characters
                        </p>
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
                                transaction ? 'Update Transaction' : 'Add Transaction'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;




