import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountTypeDisplay,
    getAccountTypeEmoji
} from '../services/accountService';
import AccountModal from '../components/AccountModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import toast from 'react-hot-toast';


const AccountsPage = () => {
    // State management
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [sortBy, setSortBy] = useState('name'); // 'name', 'balance', 'date'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'


    // Fetch accounts on mount
    useEffect(() => {
        fetchAccounts();
    }, []);

    // Filter accounts when search or filter changes
    useEffect(() => {
        filterAccounts();
    }, [accounts, searchQuery, filterType, sortBy, sortOrder]);


    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await getAccounts();
            setAccounts(response.data || response);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const filterAccounts = () => {
        let filtered = [...accounts];

        // Filter by type
        if (filterType !== 'ALL') {
            filtered = filtered.filter(account =>
                (account.type || account.accountType) === filterType
            );
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(account =>
                (account.name || account.accountName || '').toLowerCase().includes(query) ||
                (account.type || account.accountType || '').toLowerCase().includes(query) ||
                (account.bankName || '').toLowerCase().includes(query)
            );
        }

        // Sort accounts
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    const nameA = (a.name || a.accountName || '').toLowerCase();
                    const nameB = (b.name || b.accountName || '').toLowerCase();
                    comparison = nameA.localeCompare(nameB);
                    break;

                case 'balance':
                    comparison = parseFloat(a.balance || 0) - parseFloat(b.balance || 0);
                    break;

                case 'date':
                    comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                    break;

                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredAccounts(filtered);
    };


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate account statistics
    const getAccountStats = () => {
        const stats = {
            total: accounts.length,
            byType: {},
            highestBalance: 0,
            lowestBalance: Infinity,
            avgBalance: 0,
            zeroBalance: 0
        };

        accounts.forEach(account => {
            const type = account.type || account.accountType || 'unknown';
            const balance = parseFloat(account.balance || 0);

            // Count by type
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Track balances
            if (balance > stats.highestBalance) stats.highestBalance = balance;
            if (balance < stats.lowestBalance) stats.lowestBalance = balance;
            if (balance === 0) stats.zeroBalance++;
        });

        // Calculate average
        stats.avgBalance = accounts.length > 0 ? totalBalance / accounts.length : 0;

        if (stats.lowestBalance === Infinity) stats.lowestBalance = 0;

        return stats;
    };

    const accountStats = getAccountStats();


    const handleAddAccount = () => {
        setSelectedAccount(null);
        setShowAddModal(true);
    };

    const handleEditAccount = (account) => {
        setSelectedAccount(account);
        setShowEditModal(true);
    };

    const handleDeleteAccount = (account) => {
        setSelectedAccount(account);
        setShowDeleteModal(true);
    };

    const handleAccountSubmit = async (accountData) => {
        try {
            setModalLoading(true);

            if (selectedAccount) {
                // Update existing account
                await updateAccount(selectedAccount.id, accountData);
                toast.success('Account updated successfully!');
            } else {
                // Create new account
                await createAccount(accountData);
                toast.success('Account added successfully!');
            }

            // Refresh accounts list
            await fetchAccounts();

            // Close modals
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedAccount(null);

        } catch (error) {
            console.error('Error saving account:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save account';
            toast.error(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedAccount(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedAccount) return;

        try {
            setDeleteLoading(true);

            await deleteAccount(selectedAccount.id);
            toast.success('Account deleted successfully!');

            // Refresh accounts list
            await fetchAccounts();

            // Close modal
            setShowDeleteModal(false);
            setSelectedAccount(null);

        } catch (error) {
            console.error('Error deleting account:', error);

            // Show specific error messages
            if (error.response?.status === 400) {
                toast.error('Cannot delete account with existing transactions');
            } else {
                toast.error(error.response?.data?.message || 'Failed to delete account');
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
        setSelectedAccount(null);
    };

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) =>
        sum + parseFloat(account.balance || 0), 0
    );

    // Get account name (handles both backend field names)
    const getAccountName = (account) => {
        return account.name || account.accountName || 'Unnamed Account';
    };

    // Get account type (handles both backend field names)
    const getAccountType = (account) => {
        return account.type || account.accountType || 'savings';
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                                <div className="h-8 bg-gray-200 rounded w-24 mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage your financial accounts
                    </p>
                </div>
                <button
                    onClick={handleAddAccount}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Account
                </button>
            </div>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
                <p className="text-sm font-medium text-indigo-100 mb-2">Total Balance</p>
                <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
                <p className="text-sm text-indigo-100 mt-2">
                    Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                </p>
            </div>

            {/* Account Statistics */}
            {accounts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {/* Total Accounts */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Total Accounts
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{accountStats.total}</p>
                    </div>

                    {/* Average Balance */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Avg Balance
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(accountStats.avgBalance)}
                        </p>
                    </div>

                    {/* Highest Balance */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Highest
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(accountStats.highestBalance)}
                        </p>
                    </div>

                    {/* Lowest Balance */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Lowest
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(accountStats.lowestBalance)}
                        </p>
                    </div>
                </div>
            )}

            {/* Search, Filter, and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search accounts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Filter by Type */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="ALL">All Types</option>
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="cash">Cash</option>
                </select>

                {/* Sort Options */}
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="balance">Sort by Balance</option>
                        <option value="date">Sort by Date</option>
                    </select>

                    {/* Sort Order Toggle */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                        <svg
                            className={`w-5 h-5 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Results Counter */}
            {(searchQuery || filterType !== 'ALL') && (
                <div className="flex items-center justify-between py-2 mb-4">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{filteredAccounts.length}</span> of{' '}
                        <span className="font-semibold text-gray-900">{accounts.length}</span> accounts
                    </p>
                    {(searchQuery || filterType !== 'ALL') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterType('ALL');
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}


            {/* Zero Balance Warning */}
            {accountStats.zeroBalance > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-medium text-yellow-800">
                            {accountStats.zeroBalance} {accountStats.zeroBalance === 1 ? 'account has' : 'accounts have'} zero balance
                        </p>
                    </div>
                </div>
            )}


            {/* Accounts Grid */}
            {filteredAccounts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAccounts.map((account) => (
                        <div
                            key={account.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Account Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="text-3xl">
                                        {getAccountTypeEmoji(getAccountType(account))}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {getAccountName(account)}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {getAccountTypeDisplay(getAccountType(account))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="mb-4">
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(account.balance)}
                                </p>
                            </div>

                            {/* Bank Name */}
                            {account.bankName && (
                                <p className="text-sm text-gray-600 mb-4 truncate">
                                    {account.bankName}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => handleEditAccount(account)}
                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    <PencilIcon className="w-4 h-4 mr-1" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteAccount(account)}
                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4 mr-1" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Empty State
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery || filterType !== 'ALL' ? 'No accounts found' : 'No accounts yet'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery || filterType !== 'ALL'
                            ? 'Try adjusting your search or filter'
                            : 'Get started by adding your first account'}
                    </p>
                    {!searchQuery && filterType === 'ALL' && (
                        <button
                            onClick={handleAddAccount}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Your First Account
                        </button>
                    )}
                </div>
            )}

            {/* Account Modal */}
            <AccountModal
                isOpen={showAddModal || showEditModal}
                onClose={handleModalClose}
                onSubmit={handleAccountSubmit}
                account={selectedAccount}
                loading={modalLoading}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={handleDeleteModalClose}
                onConfirm={handleConfirmDelete}
                title="Delete Account"
                message="Are you sure you want to delete this account?"
                itemName={selectedAccount ? getAccountName(selectedAccount) : ''}
                loading={deleteLoading}
            />
        </div>
    );
};

export default AccountsPage;
