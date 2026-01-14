import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getAccountTypes, getAccountTypeDisplay } from '../services/accountService';

const AccountModal = ({ isOpen, onClose, onSubmit, account, loading }) => {
  // Form state - matches backend field names
  const [formData, setFormData] = useState({
    name: '',           // Backend uses 'name'
    type: 'savings',    // Backend uses 'type' (lowercase)
    balance: '',
    bankName: ''        // Backend uses 'bankName' (optional)
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || account.accountName || '',
        type: account.type || account.accountType || 'savings',
        balance: account.balance || '',
        bankName: account.bankName || account.description || ''
      });
    } else {
      // Reset form for new account
      setFormData({
        name: '',
        type: 'savings',
        balance: '',
        bankName: ''
      });
    }
    setErrors({});
  }, [account, isOpen]);

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

    // Account name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Account name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Account name must be less than 50 characters';
    }

    // Balance validation
    if (!formData.balance) {
      newErrors.balance = 'Balance is required';
    } else if (isNaN(formData.balance)) {
      newErrors.balance = 'Balance must be a number';
    } else if (parseFloat(formData.balance) < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    // Account type validation
    if (!formData.type) {
      newErrors.type = 'Please select an account type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data matching backend schema
    const submitData = {
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance),
      bankName: formData.bankName.trim() || null,
      currency: 'INR' // Default currency
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'savings',
      balance: '',
      bankName: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {account ? 'Edit Account' : 'Add New Account'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., HDFC Savings Account"
                maxLength="50"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {getAccountTypes().map(type => (
                  <option key={type} value={type}>
                    {getAccountTypeDisplay(type)}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>

            {/* Balance */}
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.balance ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.balance && (
                <p className="text-red-500 text-xs mt-1">{errors.balance}</p>
              )}
            </div>

            {/* Bank Name (Optional) */}
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name (Optional)
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g., HDFC Bank, ICICI Bank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : account ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
