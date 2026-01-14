import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getTransactions,
    deleteTransaction,
    getTransactionTypes,
    getCategories,
    createTransaction,
    updateTransaction,
    getCategoryLabel,
    getCategoryIcon,
    getCategoryColor,
    getTransactionTypeLabel,
    getTypeBadgeColor
} from '../services/transactionService';
import { getAccounts } from '../services/accountService';
import TransactionModal from '../components/TransactionModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import toast from 'react-hot-toast';

const TransactionsPage = () => {
    const navigate = useNavigate();

    //States for transactions
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterAccount, setFilterAccount] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Modal States (will be used in Block C)
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTransaction, setDeletingTransaction] = useState(null);

    // Stats
    const [stats, setStats] = useState({
        totalCredit: 0,
        totalDebit: 0,
        netBalance: 0,
        transactionCount: 0
    });

    const [modalLoading, setModalLoading] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch transactions and accounts
    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const [transactionsData, accountsData] = await Promise.all([
                getTransactions(),
                getAccounts()
            ]);

            setTransactions(transactionsData.transactions || transactionsData || []);
            setAccounts(accountsData.accounts || accountsData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load transactions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters and search
    useEffect(() => {
        filterAndSortTransactions();
    }, [transactions, searchQuery, filterType, filterCategory, filterAccount, sortBy, sortOrder]);

    const filterAndSortTransactions = () => {
        let filtered = [...transactions];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(tx =>
                tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.merchant?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(tx => tx.type === filterType);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(tx => tx.category === filterCategory);
        }

        // Apply account filter
        if (filterAccount !== 'all') {
            filtered = filtered.filter(tx =>
                tx.accountId === filterAccount || // Use accountId
                (tx.account && tx.account.id === filterAccount) // If populated
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'category':
                    comparison = (a.category || '').localeCompare(b.category || '');
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredTransactions(filtered);
        calculateStats(filtered);
    };

    // Calculate statistics
    const calculateStats = (txList) => {
        const totalCredit = txList
            .filter(tx => tx.type === 'credit')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalDebit = txList
            .filter(tx => tx.type === 'debit')
            .reduce((sum, tx) => sum + tx.amount, 0);

        setStats({
            totalCredit,
            totalDebit,
            netBalance: totalCredit - totalDebit,
            transactionCount: txList.length
        });
    };

    // Get account name helper
    const getAccountName = (transaction) => {
        // If account is populated as object
        if (typeof transaction.account === 'object') {
            return transaction.account.name || transaction.account.accountName || 'Unknown';
        }
        // If accountId only, find from accounts list
        const account = accounts.find(acc => acc.id === transaction.accountId);
        return account?.name || account?.accountName || 'Unknown Account';
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deletingTransaction) return;

        try {
            setModalLoading(true);
            await deleteTransaction(deletingTransaction.id);

            setTransactions(prev => prev.filter(tx => tx.id !== deletingTransaction.id));
            setShowDeleteModal(false);
            setDeletingTransaction(null);

            toast.success('Transaction deleted successfully!');
        } catch (err) {
            console.error('Error deleting transaction:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete transaction. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };


    // Handle transaction submit (create or update)
    const handleTransactionSubmit = async (transactionData) => {
        try {
            setModalLoading(true);

            if (editingTransaction) {
                // Update existing transaction
                await updateTransaction(editingTransaction.id, transactionData);
                toast.success('Transaction updated successfully!');
            } else {
                // Create new transaction
                await createTransaction(transactionData);
                toast.success('Transaction added successfully!');
            }

            // Refresh data
            await fetchData();

            // Close modal
            setShowModal(false);
            setEditingTransaction(null);
        } catch (err) {
            console.error('Error saving transaction:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save transaction. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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
                    <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-gray-600 mt-1">Manage your income and expenses</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTransaction(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Add Transaction
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Credit */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Credit</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatCurrency(stats.totalCredit)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                {/* Total Debit */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Debit</p>
                            <p className="text-2xl font-bold text-red-600 mt-2">
                                {formatCurrency(stats.totalDebit)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💸</span>
                        </div>
                    </div>
                </div>

                {/* Net Balance */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Net Balance</p>
                            <p className={`text-2xl font-bold mt-2 ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.netBalance)}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <span className="text-2xl">{stats.netBalance >= 0 ? '📈' : '📉'}</span>
                        </div>
                    </div>
                </div>

                {/* Transaction Count */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Transactions</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-2">
                                {stats.transactionCount}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Type Filter */}
                    <div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Types</option>
                            {getTransactionTypes().map(type => (
                                <option key={type} value={type}>
                                    {getTransactionTypeLabel(type)}
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

                    {/* Account Filter */}
                    <div>
                        <select
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Accounts</option>
                            {accounts.map(account => (
                                <option key={account._id} value={account._id}>
                                    {account.accountName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sort Options */}
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="date">Date</option>
                            <option value="amount">Amount</option>
                            <option value="category">Category</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Get started by adding your first transaction'}
                        </p>
                        {!searchQuery && filterType === 'all' && filterCategory === 'all' && filterAccount === 'all' && (
                            <button
                                onClick={() => {
                                    setEditingTransaction(null);
                                    setShowModal(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                + Add Transaction
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {transaction.description}
                                            </div>
                                            {transaction.merchant && (
                                                <div className="text-sm text-gray-500">
                                                    {transaction.merchant}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                                                {getCategoryIcon(transaction.category)} {getCategoryLabel(transaction.category)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getAccountName(transaction)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(transaction.type)}`}>
                                                {getTransactionTypeLabel(transaction.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingTransaction(transaction);
                                                    setShowModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeletingTransaction(transaction);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals placeholders - will implement in Block C */}
            {/* Transaction Modal (Add/Edit) */}
            {showModal && (
                <TransactionModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditingTransaction(null);
                    }}
                    onSubmit={handleTransactionSubmit}
                    transaction={editingTransaction}
                    accounts={accounts}
                    loading={modalLoading}  // ← UPDATED
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeletingTransaction(null);
                    }}
                    onConfirm={handleDelete}
                    title="Delete Transaction"
                    message={`Are you sure you want to delete this transaction? This action cannot be undone.`}
                    loading={modalLoading}  // ← UPDATED
                />
            )}

        </div>
    );
};

export default TransactionsPage;