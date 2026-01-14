import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Warning Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title || 'Confirm Deletion'}
          </h3>
          
          <p className="text-gray-600 mb-1">
            {message || 'Are you sure you want to delete this item?'}
          </p>
          
          {itemName && (
            <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded px-3 py-2 mb-4">
              {itemName}
            </p>
          )}

          <p className="text-sm text-red-600 mb-6">
            ⚠️ This action cannot be undone.
          </p>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
