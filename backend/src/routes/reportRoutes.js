const express = require('express');
const router = express.Router();

// Import authentication middleware
const  authenticateMiddleware  = require('../middleware/authMiddleware');
const { heavyOperationRateLimiter, generalRateLimiter } = require('../middleware/rateLimitMiddleware');

// Import report controllers
const {
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
} = require('../controllers/reportController');


// ==================== PDF REPORT ROUTES ====================

/**
 * @route   GET /api/reports/pdf/monthly
 * @desc    Generate monthly financial report (PDF)
 * @access  Private
 * @query   month, year
 */
router.get('/pdf/monthly', authenticateMiddleware, heavyOperationRateLimiter, generateMonthlyPDF);

/**
 * @route   GET /api/reports/pdf/transactions
 * @desc    Generate transaction report (PDF)
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/pdf/transactions', authenticateMiddleware, heavyOperationRateLimiter, generateTransactionPDF);

/**
 * @route   GET /api/reports/pdf/budget
 * @desc    Generate budget performance report (PDF)
 * @access  Private
 */
router.get('/pdf/budget', authenticateMiddleware, heavyOperationRateLimiter, generateBudgetPDF);

/**
 * @route   POST /api/reports/pdf/custom
 * @desc    Generate custom filtered report (PDF)
 * @access  Private
 * @body    startDate, endDate, category?, type?, minAmount?, maxAmount?, accountId?
 */
router.post('/pdf/custom', authenticateMiddleware, heavyOperationRateLimiter, generateCustomPDF);

// ==================== EXCEL EXPORT ROUTES ====================

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export transactions to CSV
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/export/csv', authenticateMiddleware, heavyOperationRateLimiter, exportTransactionsCSV);

/**
 * @route   GET /api/reports/export/excel
 * @desc    Export transactions to Excel
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/export/excel', authenticateMiddleware, heavyOperationRateLimiter, exportTransactionsExcel);

/**
 * @route   GET /api/reports/export/analytics
 * @desc    Export comprehensive analytics to multi-sheet Excel
 * @access  Private
 * @query   month, year OR startDate, endDate
 */
router.get('/export/analytics', authenticateMiddleware, heavyOperationRateLimiter, exportAnalyticsExcel);

// ==================== EMAIL ROUTES ====================

/**
 * @route   POST /api/reports/email/send
 * @desc    Send report via email
 * @access  Private
 * @body    reportType, format, month?, year?, startDate?, endDate?, recipientEmail?
 */
router.post('/email/send', authenticateMiddleware, generalRateLimiter, sendReportViaEmail);

// ==================== SCHEDULED REPORT ROUTES ====================

/**
 * @route   POST /api/reports/schedule
 * @desc    Create scheduled report
 * @access  Private
 * @body    reportType, format, frequency, time?, filters?
 */
router.post('/schedule', authenticateMiddleware, generalRateLimiter, createSchedule);

/**
 * @route   GET /api/reports/schedule
 * @desc    Get user's scheduled reports
 * @access  Private
 */
router.get('/schedule', authenticateMiddleware, generalRateLimiter, getSchedules);

/**
 * @route   PUT /api/reports/schedule/:id
 * @desc    Update scheduled report
 * @access  Private
 * @body    frequency?, time?, isActive?
 */
router.put('/schedule/:id', authenticateMiddleware, generalRateLimiter, updateSchedule);

/**
 * @route   DELETE /api/reports/schedule/:id
 * @desc    Delete scheduled report
 * @access  Private
 */
router.delete('/schedule/:id', authenticateMiddleware, generalRateLimiter, deleteSchedule);

module.exports = router;
