const PDFDocument = require('pdfkit');
const prisma = require('../prismaClient');
const { genMonthlyReport } = require('../utils/analyticsUtils.js');
const { getMonthName, getDaysInMonth } = require('../utils/dateHelper');
const { buildTransactionFilters } = require('../utils/queryBuilder');

const generateMonthlyReport = async (userId, month, year) => {
    // Generate PDF for monthly financial summary
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const daysInMonth = await getDaysInMonth(year, month);
        const reportData = await genMonthlyReport(startDate, endDate, null, userId);

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        console.log("User Data : ", user);
        const transactionsCount = await prisma.transaction.count({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        console.log('Genrated Monthly Report : ', reportData);
        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                period: 'MONTHLY',
                isActive: true
            }
        });

        const monthName = await getMonthName(month);
        console.log("Month Name : ", monthName);
        // Generate PDF document. 
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

        // Add Header content to the PDF document
        doc.fontSize(24).font('Helvetica-Bold').text('Monthly Financial Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`${monthName} ${year}`, { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1);

        // User Info 
        doc.fontSize(10).font('Helvetica').text(`Name: ${user.firstName}`, 50, doc.y);
        doc.text(`Email: ${user.email}`);
        doc.moveDown(1.5);

        // Financial Summary Section
        addSectionHeader(doc, 'Monthly Summary');
        doc.fontSize(10);
        doc.text(`Total Income: Rs. ${reportData.totalIncome}`);
        doc.text(`Total Expenses: Rs. ${reportData.totalExpenses}`);
        doc.fillColor(reportData.netSavings >= 0 ? '#008000' : '#FF0000');
        doc.text(`Net Savings: Rs. ${reportData.netSavings}`);
        doc.fillColor('#000000');
        doc.text(`Savings Rate: ${reportData.savingsRate}%`);
        doc.text(`Total Transactions: ${transactionsCount}`);
        doc.moveDown(1.5);

        // Top Spending Categories
        addSectionHeader(doc, 'Top Spending Categories');
        doc.fontSize(10);

        const sortedCategories = reportData.categoryBreakdown.slice(0, 5);
        sortedCategories.forEach((cat, index) => {
            doc.text(`${index + 1}. ${cat.category}: Rs. ${cat.amount} (${cat.percentage}%)`);
        });
        doc.moveDown(1.5);

        // Budget Performance
        if (budgets.length > 0) {
            addSectionHeader(doc, 'Budget Performance');
            doc.fontSize(10);

            for (const budget of budgets) {
                const categoryLookup = reportData.categoryBreakdown.reduce((acc, cat) => {
                    acc[cat.category] = parseFloat(cat.amount);
                    return acc;
                }, {});
                console.log("Category Lookup : ", categoryLookup);
                console.log("Budget Category : ", budget.category);
                console.log("Category Lookup Budget Category : ", categoryLookup[budget.category]);
                const spent = categoryLookup[budget.category] || 0;
                const remaining = parseFloat(budget.amount) - spent;
                const percentUsed = ((spent / parseFloat(budget.amount)) * 100).toFixed(1);

                doc.text(`${budget.category}:`);
                doc.text(`  Limit: Rs.${budget.amount} | Spent: Rs.${spent.toFixed(2)} | Remaining: Rs.${remaining.toFixed(2)}`);
                doc.text(`  Usage: ${percentUsed}%`);

                if (remaining < 0) {
                    doc.fillColor('#FF0000').text(`  ⚠️ Over budget by Rs.${Math.abs(remaining).toFixed(2)}`);
                    doc.fillColor('#000000');
                }
                doc.moveDown(0.5);
            }
            doc.moveDown(1);
        }

        // Daily Spending Trend
        addSectionHeader(doc, 'Daily Spending Trend');


        const avgDailySpending = (reportData.totalExpenses / daysInMonth).toFixed(2);
        doc.fontSize(10).text(`Average Daily Spending: Rs.${avgDailySpending}`);
        doc.moveDown(1.5);

        // Footer
        addFooter(doc);
        doc.end();

        return doc;

    }
    catch (err) {
        console.error('[PDFGenerator] Monthly report error:', err.message);
        throw new Error('Failed to generate monthly report');
    }
}

/**
 * Generate Transaction List Report
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {PDFDocument} PDF stream
 */

const generateTransactionReport = async (transactions, dateRange) => {
    // Generate PDF for transaction list
    try {
        const { startDate, endDate } = dateRange;
        // Summary Statistics
        const totalIncome = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Transaction Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(
            `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
            { align: 'center' }
        );
        doc.text(`Total Transactions: ${transactions.length}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1.5);

        addSectionHeader(doc, 'Summary');
        doc.fontSize(10);
        doc.text(`Total Income: Rs.${totalIncome.toFixed(2)}`);
        doc.text(`Total Expenses: Rs.${totalExpenses.toFixed(2)}`);
        doc.text(`Net: Rs.${(totalIncome - totalExpenses).toFixed(2)}`);
        doc.moveDown(1.5);

        // Transactions Table
        addSectionHeader(doc, 'Transaction Details');

        // Table header
        const tableTop = doc.y;
        const colWidths = { date: 70, desc: 160, category: 80, account: 70, amount: 70, type: 50 };

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Date', 50, tableTop, { width: colWidths.date });
        doc.text('Description', 125, tableTop, { width: colWidths.desc });
        doc.text('Category', 290, tableTop, { width: colWidths.category });
        doc.text('Account', 375, tableTop, { width: colWidths.account });
        doc.text('Amount', 450, tableTop, { width: colWidths.amount });
        doc.text('Type', 525, tableTop, { width: colWidths.type });

        doc.moveDown(0.5);
        doc.strokeColor('#d7d0d0').lineWidth(0.5);
        doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.3);

        // Table rows
        doc.font('Helvetica').fontSize(8);
        transactions.forEach((txn, index) => {
            const y = doc.y;

            // Add new page if needed
            if (y > 720) {
                doc.addPage();
                doc.y = 50;

                // Repeat header on new page
                doc.fontSize(9).font('Helvetica-Bold');
                doc.text('Date', 50, doc.y, { width: colWidths.date });
                doc.text('Description', 125, doc.y, { width: colWidths.desc });
                doc.text('Category', 290, doc.y, { width: colWidths.category });
                doc.text('Account', 375, doc.y, { width: colWidths.account });
                doc.text('Amount', 450, doc.y, { width: colWidths.amount });
                doc.text('Type', 525, doc.y, { width: colWidths.type });
                doc.moveDown(0.5);
                doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(560, doc.y).stroke();
                doc.moveDown(0.3);
                doc.font('Helvetica').fontSize(8);
            }

            const currentY = doc.y;
            doc.text(new Date(txn.date).toLocaleDateString(), 50, currentY, { width: colWidths.date });
            doc.text(txn.description.substring(0, 25), 125, currentY, { width: colWidths.desc });
            doc.text(txn.category || 'N/A', 290, currentY, { width: colWidths.category });
            doc.text(txn.account?.name?.substring(0, 12) || 'N/A', 375, currentY, { width: colWidths.account });

            // Color code amount based on type
            if (txn.type === 'credit') {
                doc.fillColor('#008000');
            } else {
                doc.fillColor('#FF0000');
            }
            doc.text(`Rs.${parseFloat(txn.amount).toFixed(2)}`, 450, currentY, { width: colWidths.amount });
            doc.fillColor('#000000');

            doc.text(txn.type, 525, currentY, { width: colWidths.type });

            doc.moveDown(0.7);
        });

        // Footer
        addFooter(doc);
        doc.end();

        return doc;
    }
    catch (err) {
        console.error('[PDFGenerator] Transaction report error:', err.message);
        throw new Error('Failed to generate transaction report');
    }
}


const generateBudgetReport = async (budgets, userId) => {
    try {
        // Fetch user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true }
        });

        if (!user) {
            throw new Error('User not found');
        }
        // Get current month transactions for budget comparison
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                type: 'debit'
            }
        });

        const categorySpending = {};
        transactions.forEach(t => {
            const category = t.category || 'Uncategorized';
            categorySpending[category] = (categorySpending[category] || 0) + parseFloat(t.amount);
        });

        // Overall Budget Summary
        let totalBudgeted = 0;
        let totalSpent = 0;
        let budgetsOverLimit = 0;
        console.log("Budgets : ", budgets);
        budgets.forEach(budget => {
            const spent = categorySpending[budget.category] || 0;
            totalBudgeted += parseFloat(budget.amount);
            totalSpent += spent;
            if (spent > parseFloat(budget.amount)) {
                budgetsOverLimit++;
            }
        });
        const monthName = await getMonthName(now.getMonth() + 1)
        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text('Budget Performance Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(`${monthName} ${now.getFullYear()}`, { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1);

        // User info
        doc.fontSize(10).text(`Name: ${user.firstName} ${user.lastName}`, 50, doc.y);
        doc.text(`Email: ${user.email}`);
        doc.moveDown(1.5);


        addSectionHeader(doc, 'Overall Summary');
        doc.fontSize(10);
        doc.text(`Total Budgeted: Rs.${totalBudgeted.toFixed(2)}`);
        doc.text(`Total Spent: Rs.${totalSpent.toFixed(2)}`);
        doc.text(`Remaining: Rs.${(totalBudgeted - totalSpent).toFixed(2)}`);
        doc.text(`Overall Usage: ${((totalSpent / totalBudgeted) * 100).toFixed(1)}%`);
        doc.fillColor('#FF0000');
        doc.text(`Budgets Over Limit: ${budgetsOverLimit}/${budgets.length}`);
        doc.fillColor('#000000');
        doc.moveDown(1.5);

        // Individual Budget Details
        addSectionHeader(doc, 'Budget Breakdown');

        budgets.forEach((budget, index) => {
            const spent = categorySpending[budget.category] || 0;
            const remaining = parseFloat(budget.amount) - spent;
            const percentUsed = ((spent / parseFloat(budget.amount)) * 100).toFixed(1);
            const isOverBudget = remaining < 0;

            // Budget card
            if (doc.y > 650) {
                doc.addPage();
                doc.y = 50;
            }

            doc.fontSize(12).font('Helvetica-Bold');
            if (isOverBudget) {
                doc.fillColor('#FF0000');
            }
            doc.text(`${index + 1}. ${budget.category}`, 50, doc.y);
            doc.fillColor('#000000');
            doc.moveDown(0.3);

            doc.fontSize(10).font('Helvetica');
            doc.text(`Budget Limit: Rs.${budget.amount}`);
            doc.text(`Amount Spent: Rs.${spent.toFixed(2)}`);
            doc.text(`Remaining: Rs.${remaining.toFixed(2)}`);
            doc.text(`Usage: ${percentUsed}%`);

            // Visual progress bar (text-based)
            const barLength = 40;
            const filledBars = Math.min(Math.round((percentUsed / 100) * barLength), barLength);
            const emptyBars = barLength - filledBars;
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

            doc.font('Courier');
            if (percentUsed > 100) {
                doc.fillColor('#FF0000');
            } else if (percentUsed > 80) {
                doc.fillColor('#FFA500');
            } else {
                doc.fillColor('#008000');
            }
            doc.text(progressBar);
            doc.fillColor('#000000');
            doc.font('Helvetica');

            // Status message
            if (isOverBudget) {
                doc.fillColor('#FF0000');
                doc.text(`⚠️ OVER BUDGET by Rs.${Math.abs(remaining).toFixed(2)}`, { underline: true });
                doc.fillColor('#000000');
            } else if (percentUsed > 80) {
                doc.fillColor('#FFA500');
                doc.text(`⚠️ Warning: ${(100 - percentUsed).toFixed(1)}% budget remaining`);
                doc.fillColor('#000000');
            } else {
                doc.fillColor('#008000');
                doc.text(`✓ On track - ${(100 - percentUsed).toFixed(1)}% budget remaining`);
                doc.fillColor('#000000');
            }

            doc.moveDown(1);

            // Separator line
            doc.strokeColor('#eeeeee').lineWidth(0.5);
            doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
            doc.moveDown(0.8);
        });

        // Recommendations section
        if (budgetsOverLimit > 0) {
            doc.addPage();
            addSectionHeader(doc, 'Recommendations');
            doc.fontSize(10);
            doc.text('• Review over-budget categories and identify unnecessary expenses');
            doc.text('• Consider increasing budget limits for essential categories');
            doc.text('• Set up spending alerts to monitor real-time budget usage');
            doc.text('• Analyze transaction patterns to find cost-saving opportunities');
        }

        // Footer
        addFooter(doc);
        doc.end();

        return doc;

    } catch (err) {
        console.error('[PDFGenerator] Budget report error:', err.message);
        throw new Error('Failed to generate budget report');
    }
}

/**
 * Generate Custom Filtered Report
 * @param {number} userId - User ID
 * @param {Object} filters - Custom filters { startDate, endDate, category, type, minAmount, maxAmount, accountId }
 * @returns {PDFDocument} PDF stream
 */
const generateCustomReport = async (userId, filters) => {
    try {
        const { startDate, endDate, category, type, minAmount, maxAmount, accountId } = filters;

        // Fetch user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, email: true }
        });

        const transFilter = await buildTransactionFilters(userId, filters);
        // Fetch filtered transactions
        const transactions = await prisma.transaction.findMany({
            where: transFilter.where,
            include: {
                account: {
                    select: { name: true, type: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Calculate statistics
        const totalIncome = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);


        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text('Custom Financial Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1);

        // User info
        doc.fontSize(10).text(`Name: ${user.firstName}`, 50, doc.y);
        doc.text(`Email: ${user.email}`);
        doc.moveDown(1.5);

        // Applied Filters
        addSectionHeader(doc, 'Applied Filters');
        doc.fontSize(10);
        if (startDate && endDate) {
            doc.text(`Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
        }
        if (category) doc.text(`Category: ${category}`);
        if (type) doc.text(`Type: ${type}`);
        if (minAmount) doc.text(`Min Amount: Rs.${minAmount}`);
        if (maxAmount) doc.text(`Max Amount: Rs.${maxAmount}`);
        if (accountId) doc.text(`Account ID: ${accountId}`);
        doc.text(`Results Found: ${transactions.length} transactions`);
        doc.moveDown(1.5);

        // Summary Statistics
        addSectionHeader(doc, 'Summary');
        doc.fontSize(10);
        doc.text(`Total Income: Rs.${totalIncome.toFixed(2)}`);
        doc.text(`Total Expenses: Rs.${totalExpenses.toFixed(2)}`);
        doc.text(`Net Amount: Rs.${(totalIncome - totalExpenses).toFixed(2)}`);
        doc.text(`Average Transaction: Rs.${(transactions.length > 0 ? ((totalIncome + totalExpenses) / transactions.length) : 0).toFixed(2)}`);
        doc.moveDown(1.5);

        // Transactions Table (same as generateTransactionReport)
        if (transactions.length > 0) {
            addSectionHeader(doc, 'Transaction Details');

            const tableTop = doc.y;
            const colWidths = { date: 70, desc: 160, category: 80, account: 70, amount: 70, type: 50 };

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Date', 50, tableTop, { width: colWidths.date });
            doc.text('Description', 125, tableTop, { width: colWidths.desc });
            doc.text('Category', 290, tableTop, { width: colWidths.category });
            doc.text('Account', 375, tableTop, { width: colWidths.account });
            doc.text('Amount', 450, tableTop, { width: colWidths.amount });
            doc.text('Type', 525, tableTop, { width: colWidths.type });

            doc.moveDown(0.5);
            doc.strokeColor('#cccccc').lineWidth(0.5);
            doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
            doc.moveDown(0.3);

            doc.font('Helvetica').fontSize(8);
            transactions.forEach((txn) => {
                if (doc.y > 720) {
                    doc.addPage();
                    doc.y = 50;
                }

                const currentY = doc.y;
                doc.text(new Date(txn.date).toLocaleDateString(), 50, currentY, { width: colWidths.date });
                doc.text(txn.description.substring(0, 25), 125, currentY, { width: colWidths.desc });
                doc.text(txn.category || 'N/A', 290, currentY, { width: colWidths.category });
                doc.text(txn.account?.name?.substring(0, 12) || 'N/A', 375, currentY, { width: colWidths.account });

                doc.fillColor(txn.type === 'credit' ? '#008000' : '#FF0000');
                doc.text(`Rs.${parseFloat(txn.amount).toFixed(2)}`, 450, currentY, { width: colWidths.amount });
                doc.fillColor('#000000');

                doc.text(txn.type, 525, currentY, { width: colWidths.type });
                doc.moveDown(0.7);
            });
        } else {
            doc.fontSize(10).text('No transactions found matching the specified filters.', { align: 'center' });
        }

        // Footer
        addFooter(doc);
        doc.end();

        return doc;

    } catch (err) {
        console.error('[PDFGenerator] Custom report error:', err.message);
        throw new Error('Failed to generate custom report');
    }
}


module.exports = {
    generateMonthlyReport,
    generateTransactionReport,
    generateBudgetReport,
    generateCustomReport
};


// ==================== HELPER FUNCTIONS ====================

/**
 * Add section header to PDF
 */
function addSectionHeader(doc, title) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333');
    doc.text(title, { underline: true });
    doc.fillColor('#000000');
    doc.moveDown(0.5);
}

/**
 * Add footer to PDF
 */
// function addFooter(doc) {
//     const pageCount = doc.bufferedPageRange().count;
//     console.log("Page Count : ", pageCount);
//     for (let i = 0; i < pageCount; i++) {
//         doc.switchToPage(i);
//         doc.fontSize(8).fillColor('#666666');
//         doc.text(
//             'Generated by FinCopilot - Your Personal Finance Assistant',
//             50,
//             750,
//             { align: 'center' }
//         );
//         doc.text(`Page ${i + 1} of ${pageCount}`, 50, 760, { align: 'center' });
//     }
// }


function addFooter(doc) {
    try {
        const range = doc.bufferedPageRange();
        const pageCount = range.count;

        console.log('Footer: Page count =', pageCount);

        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);

            // ✅ CORRECT: Position footer at actual bottom
            const pageHeight = doc.page.height;  // 842 for A4
            const pageWidth = doc.page.width;    // 595 for A4
            const bottomMargin = 50;
            const footerY = pageHeight - bottomMargin;  // Much lower!

            console.log(`Page height: ${pageHeight}, Footer Y: ${footerY}`);

            // Add footer text at bottom
            doc.fontSize(8).fillColor('#666666').font('Helvetica-Oblique');

            doc.text(
                'Generated by FinCopilot - Your Personal Finance Assistant',
                50,
                footerY - 30,  // ✅ Higher up from absolute bottom
                { align: 'center', width: pageWidth - 100 }
            );

            doc.text(
                `Page ${i + 1} of ${pageCount}`,
                50,
                footerY - 15,  // ✅ Just above the first line
                { align: 'center', width: pageWidth - 100 }
            );

            doc.fillColor('#000000');
        }

        console.log('✅ Footer complete');

    } catch (error) {
        console.error('Error adding footer:', error);
    }
}

