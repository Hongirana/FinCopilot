const ExcelJS = require('exceljs');
const prisma = require('../prismaClient');
const { getMonthName, getMonthRange } = require('../utils/dateHelper');
const { validateandGetDate, genMonthlyReport } = require('../utils/analyticsUtils.js');
/**
 * Export transactions to CSV format
 * @param {Array} transactions - Array of transaction objects
 * @returns {Buffer} CSV buffer
 */

const exportTransactionsToCSV = async (transactions) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transactions');

        // Define columns
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Account', key: 'account', width: 20 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        // Add data rows
        transactions.forEach(txn => {
            worksheet.addRow({
                date: new Date(txn.date).toLocaleDateString(),
                description: txn.description,
                category: txn.category || 'Uncategorized',
                type: txn.type,
                amount: parseFloat(txn.amount).toFixed(2),
                account: txn.account?.name || 'N/A',
                notes: txn.notes || ''
            });
        });

        const buffer = await workbook.csv.writeBuffer();
        return buffer;

    } catch (error) {
        console.error('[ExcelReport] CSV export error:', error.message);
        throw new Error('Failed to export transactions to CSV');
    }
}

/**
 * Export transactions to Excel format with formatting
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} options - Export options { title, dateRange }
 * @returns {Buffer} Excel buffer
 */

const exportTransactionsToExcel = async (transactions, options) => {
    try {
        const { title = 'Transactions Report', dateRange } = options;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transactions');

        // Add title row
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4788' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE7F3FF' }
        };
        worksheet.getRow(1).height = 30;

        // Add date range if provided
        if (dateRange) {
            worksheet.mergeCells('A2:G2');
            const dateCell = worksheet.getCell('A2');
            dateCell.value = `Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`;
            dateCell.font = { size: 10, italic: true };
            dateCell.alignment = { horizontal: 'center' };
            worksheet.getRow(2).height = 20;
        }

        // Add summary row
        const summaryRow = dateRange ? 3 : 2;
        const totalIncome = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        worksheet.mergeCells(`A${summaryRow}:G${summaryRow}`);
        const summaryCell = worksheet.getCell(`A${summaryRow}`);
        summaryCell.value = `Total: ${transactions.length} transactions | Income: ₹${totalIncome.toFixed(2)} | Expenses: ₹${totalExpenses.toFixed(2)} | Net: ₹${(totalIncome - totalExpenses).toFixed(2)}`;
        summaryCell.font = { size: 10, bold: true };
        summaryCell.alignment = { horizontal: 'center' };
        summaryCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
        };

        // Define columns (starting after summary)
        const headerRow = summaryRow + 1;
        worksheet.getRow(headerRow).values = [
            'Date',
            'Description',
            'Category',
            'Type',
            'Amount (₹)',
            'Account',
            'Notes'
        ];

        // Style header row
        const header = worksheet.getRow(headerRow);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1F4788' }
        };
        header.alignment = { horizontal: 'center', vertical: 'middle' };
        header.height = 25;

        // Set column widths
        worksheet.columns = [
            { key: 'date', width: 15 },
            { key: 'description', width: 35 },
            { key: 'category', width: 18 },
            { key: 'type', width: 12 },
            { key: 'amount', width: 15 },
            { key: 'account', width: 20 },
            { key: 'notes', width: 30 }
        ];

        // Add data rows with conditional formatting
        transactions.forEach((txn, index) => {
            const row = worksheet.addRow({
                date: new Date(txn.date).toLocaleDateString(),
                description: txn.description,
                category: txn.category || 'Uncategorized',
                type: txn.type === 'credit' ? 'Credit' : 'Debit',
                amount: parseFloat(txn.amount),
                account: txn.account?.name || 'N/A',
                notes: txn.notes || ''
            });

            // Alternate row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9F9F9' }
                };
            }

            // Format amount column
            row.getCell(5).numFmt = '₹#,##0.00';

            // Color code based on transaction type
            if (txn.type === 'credit') {
                row.getCell(5).font = { color: { argb: 'FF008000' }, bold: true };
            } else {
                row.getCell(5).font = { color: { argb: 'FFFF0000' }, bold: true };
            }

            // Add borders
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                };
            });
        });

        // Auto-filter
        worksheet.autoFilter = {
            from: { row: headerRow, column: 1 },
            to: { row: headerRow, column: 7 }
        };

        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;

    } catch (error) {
        console.error('[ExcelReport] Excel export error:', error.message);
        throw new Error('Failed to export transactions to Excel');
    }

}

/**
 * Export comprehensive analytics to multi-sheet Excel workbook
 * @param {number} userId - User ID
 * @param {Object} options - Export options { month, year, startDate, endDate }
 * @returns {Buffer} Excel buffer
 */

const exportAnalyticsToExcel = async (userId, options = {}) => {
    try {
        const { month, year, startDate, endDate } = options;

        const dateRange = (month && year)
            ? getMonthRange(year, month)
            : (startDate && endDate)
                ? { startDate: new Date(startDate), endDate: new Date(endDate) }
                : await validateandGetDate(startDate, endDate);
       
        // Fetch data
        const transactionsCount = await prisma.transaction.count({
            where: {
                userId,
                date: {
                    gte: dateRange.startDate,
                    lte: dateRange.endDate
                }
            }
        })

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: dateRange.startDate,
                    lte: dateRange.endDate
                }
            },
            include: {
                account: { select: { name: true, type: true } }
            },
            orderBy: { date: 'desc' }
        });

        const budgets = await prisma.budget.findMany({
            where: { userId, isActive: true }
        });

        const goals = await prisma.goal.findMany({
            where: { userId }
        });

        const reportData = await genMonthlyReport(dateRange.startDate, dateRange.endDate, null, userId);

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FinCopilot';
        workbook.created = new Date();

        // ===== SHEET 1: SUMMARY =====
        const summarySheet = workbook.addWorksheet('Summary', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        addSheetTitle(summarySheet, 'Financial Summary Report', 1);
        addSheetSubtitle(summarySheet, `Period: ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`, 2);

        summarySheet.addRow([]);
        summarySheet.addRow(['Metric', 'Value']).font = { bold: true };
       
        const avgTransaction = (transactionsCount > 0 ? (( parseFloat(reportData.totalIncome) + parseFloat(reportData.totalExpenses)) / transactionsCount ).toFixed(2) : 0);
        
        const summaryData = [
            ['Total Income', `₹${reportData.totalIncome}`],
            ['Total Expenses', `₹${reportData.totalExpenses}`],
            ['Net Savings', `₹${reportData.netSavings}`],
            ['Savings Rate', `${reportData.savingsRate}%`],
            ['Total Transactions', transactionsCount],
            ['Average Transaction Amount', `₹${avgTransaction}`]
        ];

        
        summaryData.forEach(([metric, value]) => {
            const row = summarySheet.addRow([metric, value]);
            row.getCell(2).alignment = { horizontal: 'right' };
            if (metric === 'Net Savings') {
                row.getCell(2).font = {
                    color: { argb: parseFloat(reportData.netSavings) >= 0 ? 'FF008000' : 'FFFF0000' },
                    bold: true
                };
            }
        });

        summarySheet.columns = [
            { key: 'metric', width: 25 },
            { key: 'value', width: 20 }
        ];

        // ===== SHEET 2: TRANSACTIONS =====
        const txnSheet = workbook.addWorksheet('Transactions');

        txnSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Type', key: 'type', width: 12 },
            { header: 'Amount (₹)', key: 'amount', width: 15 },
            { header: 'Account', key: 'account', width: 20 }
        ];

        // Style header
        styleHeaderRow(txnSheet, 1);

        // Add transaction data
        transactions.forEach(txn => {
            const row = txnSheet.addRow({
                date: new Date(txn.date).toLocaleDateString(),
                description: txn.description,
                category: txn.category || 'Uncategorized',
                type: txn.type === 'credit' ? 'Credit' : 'Debit',
                amount: parseFloat(txn.amount),
                account: txn.account?.name || 'N/A'
            });

            row.getCell(5).numFmt = '₹#,##0.00';
            row.getCell(5).font = {
                color: { argb: txn.type === 'credit' ? 'FF008000' : 'FFFF0000' },
                bold: true
            };
        });

        txnSheet.autoFilter = { from: 'A1', to: 'F1' };

        // ===== SHEET 3: CATEGORY BREAKDOWN =====
        const categorySheet = workbook.addWorksheet('Category Breakdown');

        addSheetTitle(categorySheet, 'Spending by Category', 1);
        categorySheet.addRow([]);

        categorySheet.addRow(['Category', 'Amount (₹)', 'Percentage']).font = { bold: true };
        styleHeaderRow(categorySheet, 3);

        const sortedCategories = reportData.categoryBreakdown;
        sortedCategories.forEach((cat) => {
            const row = categorySheet.addRow([
                cat.category,
                parseFloat(cat.amount),
                `${cat.percentage}%`
            ]);
            row.getCell(2).numFmt = '₹#,##0.00';
        });

        categorySheet.columns = [
            { key: 'category', width: 25 },
            { key: 'amount', width: 18 },
            { key: 'percentage', width: 15 }
        ];

        // ===== SHEET 4: BUDGETS =====
        const budgetSheet = workbook.addWorksheet('Budget Status');

        addSheetTitle(budgetSheet, 'Budget Performance', 1);
        budgetSheet.addRow([]);

        budgetSheet.addRow(['Category', 'Budget Limit', 'Spent', 'Remaining', 'Usage %', 'Status']).font = { bold: true };
        styleHeaderRow(budgetSheet, 3);

        const categoryLookup = reportData.categoryBreakdown.reduce((acc, cat) => {
            acc[cat.category] = parseFloat(cat.amount);
            return acc;
        }, {});

        budgets.forEach(budget => {
            const spent = categoryLookup[budget.category] || 0;
            const remaining = parseFloat(budget.amount) - spent;
            const usagePercent = (spent / parseFloat(budget.amount) * 100).toFixed(1);
            const status = remaining < 0 ? 'OVER BUDGET' : usagePercent > 80 ? 'WARNING' : 'ON TRACK';

            const row = budgetSheet.addRow([
                budget.category,
                parseFloat(budget.amount),
                spent,
                remaining,
                `${usagePercent}%`,
                status
            ]);

            row.getCell(2).numFmt = '₹#,##0.00';
            row.getCell(3).numFmt = '₹#,##0.00';
            row.getCell(4).numFmt = '₹#,##0.00';

            // Color code status
            const statusCell = row.getCell(6);
            if (status === 'OVER BUDGET') {
                statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
            } else if (status === 'WARNING') {
                statusCell.font = { color: { argb: 'FFFF8C00' }, bold: true };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E0' } };
            } else {
                statusCell.font = { color: { argb: 'FF008000' }, bold: true };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0FFE0' } };
            }
        });

        budgetSheet.columns = [
            { key: 'category', width: 20 },
            { key: 'limit', width: 15 },
            { key: 'spent', width: 15 },
            { key: 'remaining', width: 15 },
            { key: 'usage', width: 12 },
            { key: 'status', width: 18 }
        ];

        // ===== SHEET 5: GOALS =====
        const goalsSheet = workbook.addWorksheet('Financial Goals');

        addSheetTitle(goalsSheet, 'Goal Progress', 1);
        goalsSheet.addRow([]);

        goalsSheet.addRow(['Goal Name', 'Target Amount', 'Current Amount', 'Remaining', 'Progress %', 'Deadline', 'Status']).font = { bold: true };
        styleHeaderRow(goalsSheet, 3);

        goals.forEach(goal => {
            const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
            const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount) * 100).toFixed(1);

            const row = goalsSheet.addRow([
                goal.title,
                parseFloat(goal.targetAmount),
                parseFloat(goal.currentAmount),
                remaining,
                `${progress}%`,
                new Date(goal.deadline).toLocaleDateString(),
                goal.status
            ]);

            row.getCell(2).numFmt = '₹#,##0.00';
            row.getCell(3).numFmt = '₹#,##0.00';
            row.getCell(4).numFmt = '₹#,##0.00';

            // Color code status
            const statusCell = row.getCell(7);
            if (goal.status === 'completed') {
                statusCell.font = { color: { argb: 'FF008000' }, bold: true };
            } else if (goal.status === 'in_progress') {
                statusCell.font = { color: { argb: 'FF1F4788' }, bold: true };
            }
        });

        goalsSheet.columns = [
            { key: 'name', width: 25 },
            { key: 'target', width: 15 },
            { key: 'current', width: 15 },
            { key: 'remaining', width: 15 },
            { key: 'progress', width: 12 },
            { key: 'deadline', width: 15 },
            { key: 'status', width: 15 }
        ];

        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;



    } catch (error) {
        console.error('[ExcelReport] Excel export error:', error.message);
        throw new Error('Failed to export analytics to Excel');

    }
}

module.exports = {
    exportTransactionsToCSV,
    exportTransactionsToExcel,
    exportAnalyticsToExcel
}


// ==================== HELPER FUNCTIONS ====================

/**
 * Add styled title to worksheet
 */
function addSheetTitle(sheet, title, rowNumber) {
    sheet.mergeCells(`A${rowNumber}:F${rowNumber}`);
    const titleCell = sheet.getCell(`A${rowNumber}`);
    titleCell.value = title;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF1F4788' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7F3FF' }
    };
    sheet.getRow(rowNumber).height = 25;
}

/**
 * Add styled subtitle to worksheet
 */
function addSheetSubtitle(sheet, subtitle, rowNumber) {
    sheet.mergeCells(`A${rowNumber}:F${rowNumber}`);
    const subtitleCell = sheet.getCell(`A${rowNumber}`);
    subtitleCell.value = subtitle;
    subtitleCell.font = { size: 10, italic: true };
    subtitleCell.alignment = { horizontal: 'center' };
    sheet.getRow(rowNumber).height = 18;
}

/**
 * Style header row
 */
function styleHeaderRow(sheet, rowNumber) {
    const headerRow = sheet.getRow(rowNumber);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4788' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
}