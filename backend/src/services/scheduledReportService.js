const cron = require('node-cron');
const prisma = require('../prismaClient');
const { generateMonthlyReport, generateTransactionReport, generateBudgetReport } = require('./pdfGeneratorService');
const { exportTransactionsToExcel, exportAnalyticsToExcel } = require('./excelGeneratorService');
const { sendScheduledReport } = require('./emailService');

// Store active cron jobs in memory
const activeCronJobs = new Map();

/**
 * Initialize all scheduled reports from database
 * Call this when server starts
 */
async function initializeScheduledReports() {
  try {
    // Fetch all active scheduled reports
    const scheduledReports = await prisma.scheduledReport.findMany({
      where: { isActive: true },
      include: { user: { select: { email: true, firstName: true } } }
    });

    console.log(`[ScheduledReports] Initializing ${scheduledReports.length} scheduled reports...`);

    for (const report of scheduledReports) {
      await startScheduledReport(report);
    }

    console.log('[ScheduledReports] All scheduled reports initialized successfully');
  } catch (error) {
    console.error('[ScheduledReports] Initialization error:', error.message);
    throw new Error('Failed to initialize scheduled reports');
  }
}

/**
 * Start a scheduled report (create cron job)
 * @param {Object} scheduleConfig - Schedule configuration from database
 */
async function startScheduledReport(scheduleConfig) {
  try {
    const { id, userId, reportType, format, frequency, cronExpression, filters } = scheduleConfig;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Create cron job
    const job = cron.schedule(cronExpression, async () => {
      console.log(`[ScheduledReports] Executing report ${id} for user ${userId}`);
      
      try {
        await executeScheduledReport(scheduleConfig);
        
        // Update last run time
        await prisma.scheduledReport.update({
          where: { id },
          data: { lastRunAt: new Date() }
        });
      } catch (error) {
        console.error(`[ScheduledReports] Execution failed for report ${id}:`, error.message);
        
        // Update error status
        await prisma.scheduledReport.update({
          where: { id },
          data: { 
            lastRunAt: new Date(),
            lastError: error.message
          }
        });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata' // Change to your timezone
    });

    // Store job in memory
    activeCronJobs.set(id, job);
    
    console.log(`[ScheduledReports] Started report ${id} with schedule: ${cronExpression}`);
  } catch (error) {
    console.error('[ScheduledReports] Start error:', error.message);
    throw error;
  }
}

/**
 * Execute a scheduled report (generate and send)
 * @param {Object} scheduleConfig - Schedule configuration
 */
async function executeScheduledReport(scheduleConfig) {
  try {
    const { userId, reportType, format, frequency, filters } = scheduleConfig;

    // Fetch user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let reportBuffer;
    let filename;

    // Generate report based on type and format
    if (reportType === 'monthly') {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      if (format === 'pdf') {
        const pdfStream = await generateMonthlyReport(userId, month, year);
        reportBuffer = await streamToBuffer(pdfStream);
        filename = `Monthly_Report_${month}_${year}.pdf`;
      } else if (format === 'excel') {
        reportBuffer = await exportAnalyticsToExcel(userId, { month, year });
        filename = `Monthly_Report_${month}_${year}.xlsx`;
      }
    } else if (reportType === 'transactions') {
      const { startDate, endDate } = calculateDateRange(frequency);
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        include: {
          account: { select: { name: true, type: true } }
        },
        orderBy: { date: 'desc' }
      });

      if (format === 'pdf') {
        const pdfStream = await generateTransactionReport(transactions, { startDate, endDate });
        reportBuffer = await streamToBuffer(pdfStream);
        filename = `Transactions_${frequency}_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (format === 'excel') {
        const { exportTransactionsToExcel } = require('./excelGeneratorService');
        reportBuffer = await exportTransactionsToExcel(transactions, {
          title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Transaction Report`,
          dateRange: { startDate, endDate }
        });
        filename = `Transactions_${frequency}_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
    } else if (reportType === 'budget') {
      const budgets = await prisma.budget.findMany({
        where: { userId, isActive: true }
      });

      if (format === 'pdf') {
        const pdfStream = await generateBudgetReport(budgets, userId);
        reportBuffer = await streamToBuffer(pdfStream);
        filename = `Budget_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (format === 'excel') {
        reportBuffer = await exportAnalyticsToExcel(userId, {});
        filename = `Budget_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
    }

    // Send email with report
    await sendScheduledReport(
      user.email,
      `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      frequency,
      reportBuffer,
      filename
    );

    console.log(`[ScheduledReports] Report sent successfully to ${user.email}`);
  } catch (error) {
    console.error('[ScheduledReports] Execution error:', error.message);
    throw error;
  }
}

/**
 * Create a new scheduled report
 * @param {Object} scheduleData - Schedule configuration
 * @returns {Object} Created schedule
 */
async function createScheduledReport(scheduleData) {
  try {
    const { userId, reportType, format, frequency, time, filters } = scheduleData;

    // Generate cron expression based on frequency
    const cronExpression = generateCronExpression(frequency, time);

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error('Invalid schedule configuration');
    }

    // Create in database
    const schedule = await prisma.scheduledReport.create({
      data: {
        userId,
        reportType,
        format,
        frequency,
        cronExpression,
        filters: filters || {},
        isActive: true
      },
      include: {
        user: { select: { email: true, firstName: true } }
      }
    });

    // Start the cron job
    await startScheduledReport(schedule);

    console.log(`[ScheduledReports] Created and started report ${schedule.id}`);
    return schedule;
  } catch (error) {
    console.error('[ScheduledReports] Create error:', error.message);
    throw new Error(`Failed to create scheduled report: ${error.message}`);
  }
}

/**
 * Get all scheduled reports for a user
 * @param {String} userId - User ID
 * @returns {Array} Scheduled reports
 */
async function getUserScheduledReports(userId) {
  try {
    const schedules = await prisma.scheduledReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Add status info (whether cron job is running)
    return schedules.map(schedule => ({
      ...schedule,
      isRunning: activeCronJobs.has(schedule.id)
    }));
  } catch (error) {
    console.error('[ScheduledReports] Get user reports error:', error.message);
    throw new Error('Failed to fetch scheduled reports');
  }
}

/**
 * Update a scheduled report
 * @param {number} scheduleId - Schedule ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated schedule
 */
async function updateScheduledReport(scheduleId, updateData) {
  try {
    const { frequency, time, isActive } = updateData;

    // Stop existing cron job
    await stopScheduledReport(scheduleId);

    // Generate new cron expression if frequency or time changed
    let cronExpression;
    if (frequency || time) {
      const existingSchedule = await prisma.scheduledReport.findUnique({
        where: { id: scheduleId }
      });
      cronExpression = generateCronExpression(
        frequency || existingSchedule.frequency,
        time || existingSchedule.cronExpression.split(' ')[1] + ':' + existingSchedule.cronExpression.split(' ')[0]
      );
    }

    // Update in database
    const updated = await prisma.scheduledReport.update({
      where: { id: scheduleId },
      data: {
        ...(frequency && { frequency }),
        ...(cronExpression && { cronExpression }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        user: { select: { email: true, firstName: true } }
      }
    });

    // Restart if active
    if (updated.isActive) {
      await startScheduledReport(updated);
    }

    console.log(`[ScheduledReports] Updated report ${scheduleId}`);
    return updated;
  } catch (error) {
    console.error('[ScheduledReports] Update error:', error.message);
    throw new Error('Failed to update scheduled report');
  }
}

/**
 * Delete a scheduled report
 * @param {number} scheduleId - Schedule ID
 */
async function deleteScheduledReport(scheduleId) {
  try {
    // Stop cron job
    await stopScheduledReport(scheduleId);

    // Delete from database
    await prisma.scheduledReport.delete({
      where: { id: scheduleId }
    });

    console.log(`[ScheduledReports] Deleted report ${scheduleId}`);
  } catch (error) {
    console.error('[ScheduledReports] Delete error:', error.message);
    throw new Error('Failed to delete scheduled report');
  }
}

/**
 * Stop a scheduled report (stop cron job)
 * @param {number} scheduleId - Schedule ID
 */
async function stopScheduledReport(scheduleId) {
  try {
    const job = activeCronJobs.get(scheduleId);
    
    if (job) {
      job.stop();
      activeCronJobs.delete(scheduleId);
      console.log(`[ScheduledReports] Stopped report ${scheduleId}`);
    }
  } catch (error) {
    console.error('[ScheduledReports] Stop error:', error.message);
  }
}

/**
 * Stop all scheduled reports (for server shutdown)
 */
function stopAllScheduledReports() {
  console.log('[ScheduledReports] Stopping all scheduled reports...');
  
  for (const [id, job] of activeCronJobs.entries()) {
    job.stop();
    console.log(`[ScheduledReports] Stopped report ${id}`);
  }
  
  activeCronJobs.clear();
  console.log('[ScheduledReports] All reports stopped');
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate cron expression from frequency and time
 * @param {string} frequency - daily/weekly/monthly
 * @param {string} time - Time in HH:MM format (24-hour)
 * @returns {string} Cron expression
 */
function generateCronExpression(frequency, time = '09:00') {
  const [hour, minute] = time.split(':');

  switch (frequency.toLowerCase()) {
    case 'daily':
      // Every day at specified time
      return `${minute} ${hour} * * *`;
    
    case 'weekly':
      // Every Monday at specified time
      return `${minute} ${hour} * * 1`;
    
    case 'monthly':
      // 1st of every month at specified time
      return `${minute} ${hour} 1 * *`;
    
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}

/**
 * Calculate date range based on frequency
 * @param {string} frequency - daily/weekly/monthly
 * @returns {Object} { startDate, endDate }
 */
function calculateDateRange(frequency) {
  const now = new Date();
  let startDate, endDate;

  switch (frequency.toLowerCase()) {
    case 'daily':
      // Yesterday
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'weekly':
      // Last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'monthly':
      // Last month
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return { startDate, endDate };
}

/**
 * Convert stream to buffer
 * @param {Stream} stream - Readable stream
 * @returns {Promise<Buffer>} Buffer
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

module.exports = {
  initializeScheduledReports,
  createScheduledReport,
  getUserScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  stopScheduledReport,
  stopAllScheduledReports,
  executeScheduledReport
};
