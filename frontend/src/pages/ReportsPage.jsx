import { useState, useEffect } from 'react';
import {
    downloadMonthlyPDF,
    downloadTransactionPDF,
    downloadBudgetPDF,
    downloadTransactionsCSV,
    downloadTransactionsExcel,
    downloadAnalyticsExcel,
    getMonths,
    getCurrentMonthYear,
    getLastMonth,
    getCurrentMonthRange,
    getLastMonthRange
} from '../services/reportService';
import toast from 'react-hot-toast';

const ReportsPage = () => {
    // Monthly Report State
    const [monthlyMonth, setMonthlyMonth] = useState(getCurrentMonthYear().month);
    const [monthlyYear, setMonthlyYear] = useState(getCurrentMonthYear().year);
    const [monthlyLoading, setMonthlyLoading] = useState(false);

    // Transaction Report State
    const currentMonth = getCurrentMonthRange();
    const [txStartDate, setTxStartDate] = useState(currentMonth.startDate);
    const [txEndDate, setTxEndDate] = useState(currentMonth.endDate);
    const [txLoading, setTxLoading] = useState(false);

    // Analytics Report State
    const [analyticsMonth, setAnalyticsMonth] = useState(getCurrentMonthYear().month);
    const [analyticsYear, setAnalyticsYear] = useState(getCurrentMonthYear().year);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Budget Report State
    const [budgetLoading, setBudgetLoading] = useState(false);

    // Generate year options (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    // Handle Monthly PDF Download
    const handleMonthlyPDF = async () => {
        try {
            setMonthlyLoading(true);
            await downloadMonthlyPDF(monthlyMonth, monthlyYear);
            toast.success('Monthly report downloaded successfully!');
        } catch (err) {
            console.error('Error downloading monthly report:', err);
            toast.error(err.response?.data?.message || 'Failed to download report');
        } finally {
            setMonthlyLoading(false);
        }
    };

    // Handle Transaction PDF Download
    const handleTransactionPDF = async () => {
        if (!txStartDate || !txEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        if (new Date(txEndDate) < new Date(txStartDate)) {
            toast.error('End date must be after start date');
            return;
        }

        try {
            setTxLoading(true);
            await downloadTransactionPDF(txStartDate, txEndDate);
            toast.success('Transaction report downloaded successfully!');
        } catch (err) {
            console.error('Error downloading transaction report:', err);
            toast.error(err.response?.data?.message || 'Failed to download report');
        } finally {
            setTxLoading(false);
        }
    };

    // Handle Transaction CSV Download
    const handleTransactionCSV = async () => {
        if (!txStartDate || !txEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        if (new Date(txEndDate) < new Date(txStartDate)) {
            toast.error('End date must be after start date');
            return;
        }

        try {
            setTxLoading(true);
            await downloadTransactionsCSV(txStartDate, txEndDate);
            toast.success('Transactions exported to CSV successfully!');
        } catch (err) {
            console.error('Error exporting CSV:', err);
            toast.error(err.response?.data?.message || 'Failed to export CSV');
        } finally {
            setTxLoading(false);
        }
    };

    // Handle Transaction Excel Download
    const handleTransactionExcel = async () => {
        if (!txStartDate || !txEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        if (new Date(txEndDate) < new Date(txStartDate)) {
            toast.error('End date must be after start date');
            return;
        }

        try {
            setTxLoading(true);
            await downloadTransactionsExcel(txStartDate, txEndDate);
            toast.success('Transactions exported to Excel successfully!');
        } catch (err) {
            console.error('Error exporting Excel:', err);
            toast.error(err.response?.data?.message || 'Failed to export Excel');
        } finally {
            setTxLoading(false);
        }
    };

    // Handle Analytics Excel Download
    const handleAnalyticsExcel = async () => {
        try {
            setAnalyticsLoading(true);
            await downloadAnalyticsExcel({
                month: analyticsMonth,
                year: analyticsYear
            });
            toast.success('Analytics report downloaded successfully!');
        } catch (err) {
            console.error('Error downloading analytics:', err);
            toast.error(err.response?.data?.message || 'Failed to download analytics');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Handle Budget PDF Download
    const handleBudgetPDF = async () => {
        try {
            setBudgetLoading(true);
            await downloadBudgetPDF();
            toast.success('Budget report downloaded successfully!');
        } catch (err) {
            console.error('Error downloading budget report:', err);
            toast.error(err.response?.data?.message || 'Failed to download report');
        } finally {
            setBudgetLoading(false);
        }
    };

    // Quick date presets
    const setCurrentMonth = () => {
        const range = getCurrentMonthRange();
        setTxStartDate(range.startDate);
        setTxEndDate(range.endDate);
    };

    const setLastMonth = () => {
        const range = getLastMonthRange();
        setTxStartDate(range.startDate);
        setTxEndDate(range.endDate);
    };

    const setLast3Months = () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);
        setTxStartDate(start.toISOString().split('T')[0]);
        setTxEndDate(end.toISOString().split('T')[0]);
    };

    const setCurrentYear = () => {
        const start = new Date(currentYear, 0, 1);
        const end = new Date();
        setTxStartDate(start.toISOString().split('T')[0]);
        setTxEndDate(end.toISOString().split('T')[0]);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Download and export your financial data</p>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Report Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Monthly Report</h3>
                            <p className="text-sm text-gray-600">Comprehensive monthly summary</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Month Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Month
                                </label>
                                <select
                                    value={monthlyMonth}
                                    onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    disabled={monthlyLoading}
                                >
                                    {getMonths().map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Year
                                </label>
                                <select
                                    value={monthlyYear}
                                    onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    disabled={monthlyLoading}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleMonthlyPDF}
                            disabled={monthlyLoading}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {monthlyLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                '📄 Download PDF'
                            )}
                        </button>
                    </div>
                </div>

                {/* Transaction Report Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💳</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Transaction Report</h3>
                            <p className="text-sm text-gray-600">Export transactions by date range</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={txStartDate}
                                    onChange={(e) => setTxStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={txLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={txEndDate}
                                    onChange={(e) => setTxEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={txLoading}
                                />
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">Quick Select:</p>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={setCurrentMonth}
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                    disabled={txLoading}
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={setLastMonth}
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                    disabled={txLoading}
                                >
                                    Last Month
                                </button>
                                <button
                                    onClick={setLast3Months}
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                    disabled={txLoading}
                                >
                                    Last 3 Months
                                </button>
                                <button
                                    onClick={setCurrentYear}
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                    disabled={txLoading}
                                >
                                    This Year
                                </button>
                            </div>
                        </div>

                        {/* Download Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={handleTransactionPDF}
                                disabled={txLoading}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-blue-400"
                            >
                                📄 PDF
                            </button>
                            <button
                                onClick={handleTransactionExcel}
                                disabled={txLoading}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-green-400"
                            >
                                📊 Excel
                            </button>
                            <button
                                onClick={handleTransactionCSV}
                                disabled={txLoading}
                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:bg-purple-400"
                            >
                                📑 CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Budget Report Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Budget Report</h3>
                            <p className="text-sm text-gray-600">Current budget performance</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">
                                Generate a comprehensive report of all your active budgets with spending analysis and recommendations.
                            </p>
                        </div>

                        <button
                            onClick={handleBudgetPDF}
                            disabled={budgetLoading}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            {budgetLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                '📄 Download Budget Report'
                            )}
                        </button>
                    </div>
                </div>

                {/* Analytics Report Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Analytics Report</h3>
                            <p className="text-sm text-gray-600">Multi-sheet Excel with insights</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Month Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Month
                                </label>
                                <select
                                    value={analyticsMonth}
                                    onChange={(e) => setAnalyticsMonth(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    disabled={analyticsLoading}
                                >
                                    {getMonths().map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Year
                                </label>
                                <select
                                    value={analyticsYear}
                                    onChange={(e) => setAnalyticsYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    disabled={analyticsLoading}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xs text-purple-700">
                                Includes: Summary, Transactions, Category Breakdown, Trends, and Budget Performance
                            </p>
                        </div>

                        <button
                            onClick={handleAnalyticsExcel}
                            disabled={analyticsLoading}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                        >
                            {analyticsLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                '📊 Download Analytics Excel'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <span className="text-blue-500 text-2xl">ℹ️</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Report Information</h3>
                        <div className="mt-2 text-sm text-blue-700 space-y-1">
                            <p>• <strong>Monthly Report:</strong> Complete financial summary for a specific month</p>
                            <p>• <strong>Transaction Report:</strong> Detailed list of all transactions in a date range</p>
                            <p>• <strong>Budget Report:</strong> Current budget status and spending analysis</p>
                            <p>• <strong>Analytics Report:</strong> Comprehensive multi-sheet Excel with charts and insights</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
