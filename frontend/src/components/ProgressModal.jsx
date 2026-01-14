import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProgressModal = ({
  isOpen,
  onClose,
  onSubmit,
  goal,
  loading
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!amount || amount.trim() === '') {
      setError('Amount is required');
      return;
    }

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
      setError('Amount must be a valid number');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (goal && (parseFloat(goal.currentAmount) + numAmount) > parseFloat(goal.targetAmount)) {
      const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
      setError(`Amount exceeds remaining target (₹${remaining.toFixed(2)} left)`);
      return;
    }

    onSubmit(numAmount);
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (!isOpen || !goal) return null;

  const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Progress
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
          {/* Goal Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{goal.title}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current:</span>
                <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-semibold text-indigo-600">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={remaining}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              How much are you contributing today?
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Add:</p>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, remaining].map((quickAmount, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setAmount(quickAmount.toString());
                    setError('');
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={loading || quickAmount > remaining}
                >
                  {index === 3 ? 'Full' : `₹${quickAmount.toLocaleString('en-IN')}`}
                </button>
              ))}
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Progress'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressModal;
