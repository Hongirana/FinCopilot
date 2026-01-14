const {
    generateMonthlyReport,
    generateTransactionReport,
    generateBudgetReport,
    generateCustomReport
} = require('../services/pdfGeneratorService');

const {
    exportTransactionsToCSV,
    exportTransactionsToExcel,
    exportAnalyticsToExcel
} = require('../services/excelGeneratorService');

const {
    sendReportEmail,
    sendMultipleReports
} = require('../services/emailService');

const {
    createScheduledReport,
    getUserScheduledReports,
    updateScheduledReport,
    deleteScheduledReport,
    executeScheduledReport
} = require('../services/scheduledReportService');

const prisma = require('../prismaClient');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { error } = require('node:console');
const e = require('express');

// ==================== PDF REPORT GENERATION ====================

/**
 * Generate Monthly PDF Report
 * GET /api/reports/pdf/monthly?month=1&year=2026
 */
const generateMonthlyPDF = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;

        // Validation
        if (!month || !year) {
           return errorResponse(res, 400, 'Missing month or year');
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (monthNum < 1 || monthNum > 12) {
            return errorResponse(res, 400, 'Invalid month');
        }

        if (yearNum < 2000 || yearNum > 2100) {
            return errorResponse(res, 400, 'Invalid year');
        }

        // Generate PDF
        const pdfStream = await generateMonthlyReport(userId, monthNum, yearNum);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Monthly_Report_${monthNum}_${yearNum}.pdf`);

        // Pipe PDF stream to response
        pdfStream.pipe(res);

    } catch (error) {
        console.error('[ReportController] Monthly PDF error:', error.message);
        return errorResponse(res, 500, 'Failed to generate monthly report', error.message);
    }
};

/**
 * Generate Transaction PDF Report
 * GET /api/reports/pdf/transactions?startDate=2026-01-01&endDate=2026-01-31
 */
const generateTransactionPDF = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        // Validation
        if (!startDate || !endDate) {
            return errorResponse(res, 400, 'Start date and end date are required');
        }

        // Fetch transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                account: { select: { name: true, type: true } }
            },
            orderBy: { date: 'desc' }
        });

        if (transactions.length === 0) {
           return errorResponse(res, 404, 'No transactions found');
        }

        // Generate PDF
        const pdfStream = await generateTransactionReport(transactions, {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Transactions_${startDate}_${endDate}.pdf`);

        // Pipe PDF stream to response
        pdfStream.pipe(res);

    } catch (error) {
        console.error('[ReportController] Transaction PDF error:', error.message);
        return errorResponse(res, 500, 'Failed to generate transaction report', error.message);
    }
};

/**
 * Generate Budget PDF Report
 * GET /api/reports/pdf/budget
 */
const generateBudgetPDF = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch budgets
        const budgets = await prisma.budget.findMany({
            where: { userId, isActive: true }
        });

        if (budgets.length === 0) {
            return errorResponse(res, 404, 'No budgets found');
        }

        // Generate PDF
        const pdfStream = await generateBudgetReport(budgets, userId);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Budget_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        // Pipe PDF stream to response
        pdfStream.pipe(res);

    } catch (error) {
        console.error('[ReportController] Budget PDF error:', error.message);
        return errorResponse(res, 500, 'Failed to generate budget report', error.message);
    }
};

/**
 * Generate Custom PDF Report
 * POST /api/reports/pdf/custom
 * Body: { startDate, endDate, category?, type?, minAmount?, maxAmount?, accountId? }
 */
const generateCustomPDF = async (req, res) => {
    try {
        const userId = req.user.id;
        const filters = req.body;

        // Validation
        if (!filters.startDate || !filters.endDate) {
            return errorResponse(res, 400, 'Start date and end date are required');
        }

        // Generate PDF
        const pdfStream = await generateCustomReport(userId, filters);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Custom_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        // Pipe PDF stream to response
        pdfStream.pipe(res);

    } catch (error) {
        console.error('[ReportController] Custom PDF error:', error.message);
        return errorResponse(res, 500, 'Failed to generate custom report', error.message);
    }
};

// ==================== EXCEL EXPORT ====================

/**
 * Export Transactions to CSV
 * GET /api/reports/export/csv?startDate=2026-01-01&endDate=2026-01-31
 */
const exportTransactionsCSV = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return errorResponse(res, 400, 'Start date and end date are required');
        }

        // Fetch transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                account: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        if (transactions.length === 0) {
           return errorResponse(res, 404, 'No transactions found');
        }

        // Generate CSV
        const csvBuffer = await exportTransactionsToCSV(transactions);

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Transactions_${startDate}_${endDate}.csv`);

        res.send(csvBuffer);

    } catch (error) {
        console.error('[ReportController] CSV export error:', error.message);
        return errorResponse(res, 500, 'Failed to export transactions to CSV', error.message);
    }
};

/**
 * Export Transactions to Excel
 * GET /api/reports/export/excel?startDate=2026-01-01&endDate=2026-01-31
 */
const exportTransactionsExcel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return errorResponse(res, 400, 'Start date and end date are required');
        }

        // Fetch transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                account: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        if (transactions.length === 0) {
           return errorResponse(res, 404, 'No transactions found'); 
        }

        // Generate Excel
        const excelBuffer = await exportTransactionsToExcel(transactions, {
            title: 'Transaction Report',
            dateRange: {
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Transactions_${startDate}_${endDate}.xlsx`);

        res.send(excelBuffer);

    } catch (error) {
        console.error('[ReportController] Excel export error:', error.message);
        return errorResponse(res, 500, 'Failed to export transactions to Excel', error.message);
    }
};

/**
 * Export Analytics to Excel (Multi-sheet)
 * GET /api/reports/export/analytics?month=1&year=2026
 */
const exportAnalyticsExcel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year, startDate, endDate } = req.query;

        let options = {};

        if (month && year) {
            options = {
                month: parseInt(month),
                year: parseInt(year)
            };
        } else if (startDate && endDate) {
            options = { startDate, endDate };
        } else {
            return errorResponse(res, 400, 'Month, year, or start date and end date are required');
        }

        // Generate multi-sheet Excel
        const excelBuffer = await exportAnalyticsToExcel(userId, options);

        // Set response headers
        const filename = month
            ? `Analytics_${month}_${year}.xlsx`
            : `Analytics_${startDate}_${endDate}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        res.send(excelBuffer);

    } catch (error) {
        console.error('[ReportController] Analytics export error:', error.message);
        return errorResponse(res, 500, 'Failed to export analytics to Excel', error.message);
    }
};

// ==================== EMAIL REPORTS ====================

/**
 * Send Report via Email
 * POST /api/reports/email/send
 * Body: { reportType, format, month?, year?, startDate?, endDate?, recipientEmail? }
 */
const sendReportViaEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reportType, format, month, year, startDate, endDate, recipientEmail } = req.body;

        // Validation
        if (!reportType || !format) {
           return errorResponse(res, 400, 'Report type and format are required');
        }

        // Get user email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true }
        });

        const toEmail = recipientEmail || user.email;

        let reportBuffer, filename, reportData = {};

        // Generate report based on type
        if (reportType === 'monthly' && month && year) {
            if (format === 'pdf') {
                const pdfStream = await generateMonthlyReport(userId, parseInt(month), parseInt(year));
                reportBuffer = await streamToBuffer(pdfStream);
                filename = `Monthly_Report_${month}_${year}.pdf`;
            } else if (format === 'excel') {
                reportBuffer = await exportAnalyticsToExcel(userId, {
                    month: parseInt(month),
                    year: parseInt(year)
                });
                filename = `Monthly_Report_${month}_${year}.xlsx`;
            }

            reportData = {
                period: `${getMonthName(parseInt(month))} ${year}`,
                transactionCount: null // Will be calculated in email template
            };

        } else if (reportType === 'transactions' && startDate && endDate) {
            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                include: { account: { select: { name: true } } },
                orderBy: { date: 'desc' }
            });

            if (format === 'pdf') {
                const pdfStream = await generateTransactionReport(transactions, { startDate: new Date(startDate), endDate: new Date(endDate) });
                reportBuffer = await streamToBuffer(pdfStream);
                filename = `Transactions_${startDate}_${endDate}.pdf`;
            } else if (format === 'excel') {
                reportBuffer = await exportTransactionsToExcel(transactions, {
                    title: 'Transaction Report',
                    dateRange: { startDate: new Date(startDate), endDate: new Date(endDate) }
                });
                filename = `Transactions_${startDate}_${endDate}.xlsx`;
            }

            // Calculate summary
            const totalIncome = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount), 0);

            reportData = {
                period: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
                totalIncome: totalIncome.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netSavings: (totalIncome - totalExpenses).toFixed(2),
                transactionCount: transactions.length
            };

        } else {
            return errorResponse(res, 400, 'Invalid report type or format');
        }

        // Send email
        const emailResult = await sendReportEmail({
            to: toEmail,
            subject: `Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - FinCopilot`,
            reportType: format.toUpperCase(),
            attachment: reportBuffer,
            filename: filename,
            reportData: reportData
        });

        return successResponse(res, 200, 'Report sent via email', emailResult);

    } catch (error) {
        console.error('[ReportController] Email send error:', error.message);
       return errorResponse(res, 500, 'Failed to send report via email', error.message);
    }
};

// ==================== SCHEDULED REPORTS ====================

/**
 * Create Scheduled Report
 * POST /api/reports/schedule
 * Body: { reportType, format, frequency, time, filters? }
 */
const createSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reportType, format, frequency, time, filters } = req.body;

        // Validation
        if (!reportType || !format || !frequency) {
            return errorResponse(res, 400, 'Report type, format, and frequency are required');
        }

        if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
            return errorResponse(res, 400, 'Frequency must be daily, weekly, or monthly');  
        }

        if (!['pdf', 'excel'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Format must be pdf or excel'
            });
        }

        // Create schedule
        const schedule = await createScheduledReport({
            userId,
            reportType,
            format,
            frequency,
            time: time || '09:00',
            filters: filters || {}
        });

       return successResponse(res, 201, 'Scheduled report created successfully', schedule);

    } catch (error) {
        console.error('[ReportController] Create schedule error:', error.message);
        return errorResponse(res, 500, 'Failed to create scheduled report', error.message); 
    }
};

/**
 * Get User's Scheduled Reports
 * GET /api/reports/schedule
 */
const getSchedules = async (req, res) => {
    try {
        const userId = req.user.id;

        const schedules = await getUserScheduledReports(userId);

        return successResponse(res, 200, 'Scheduled reports fetched successfully', schedules);

    } catch (error) {
        console.error('[ReportController] Get schedules error:', error.message);
       return errorResponse(res, 500, 'Failed to fetch scheduled reports', error.message);
    }
};

/**
 * Update Scheduled Report
 * PUT /api/reports/schedule/:id
 * Body: { frequency?, time?, isActive? }
 */
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;

        // Verify ownership
        const existing = await prisma.scheduledReport.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return errorResponse(res, 404, 'Scheduled report not found');
        }

        if (existing.userId !== userId) {
            return errorResponse(res, 403, 'You do not have permission to update this scheduled report');
        }

        // Update schedule
        const updated = await updateScheduledReport(parseInt(id), updateData);

        return successResponse(res, 200, 'Scheduled report updated successfully', updated);

    } catch (error) {
        console.error('[ReportController] Update schedule error:', error.message);
        return errorResponse(res, 500, 'Failed to update scheduled report', error.message);
    }
};

/**
 * Delete Scheduled Report
 * DELETE /api/reports/schedule/:id
 */
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const existing = await prisma.scheduledReport.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return errorResponse(res, 404, 'Scheduled report not found');
        }

        if (existing.userId !== userId) {
            return errorResponse(res, 403, 'You do not have permission to delete this scheduled report');
        }

        // Delete schedule
        await deleteScheduledReport(parseInt(id));

        return successResponse(res, 200, 'Scheduled report deleted successfully');

    } catch (error) {
        console.error('[ReportController] Delete schedule error:', error.message);
        return errorResponse(res, 500, 'Failed to delete scheduled report', error.message);
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert stream to buffer
 */
function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

/**
 * Get month name from number
 */
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || 'Unknown';
}

module.exports = {
    // PDF Reports
    generateMonthlyPDF,
    generateTransactionPDF,
    generateBudgetPDF,
    generateCustomPDF,

    // Excel Exports
    exportTransactionsCSV,
    exportTransactionsExcel,
    exportAnalyticsExcel,

    // Email
    sendReportViaEmail,

    // Scheduled Reports
    createSchedule,
    getSchedules,
    updateSchedule,
    deleteSchedule
};
