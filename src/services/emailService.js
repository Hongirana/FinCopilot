const nodemailer = require('nodemailer');
require('dotenv').config();
/**
 * Create email transporter
 * Configure with your email service (Gmail, Outlook, etc.)
 */
function createTransporter() {
  // Option 1: Using Gmail (requires App Password)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Option 2: Using custom SMTP (uncomment if needed)
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  */

  return transporter;
}

/**
 * Send email with report attachment
 * @param {Object} emailOptions - Email configuration
 * @param {string} emailOptions.to - Recipient email
 * @param {string} emailOptions.subject - Email subject
 * @param {string} emailOptions.reportType - Type of report (PDF/Excel)
 * @param {Buffer} emailOptions.attachment - Report file buffer
 * @param {string} emailOptions.filename - Attachment filename
 * @param {Object} emailOptions.reportData - Report data for email body
 * @returns {Object} Email send result
 */
async function sendReportEmail(emailOptions) {
  try {
    const { to, subject, reportType, attachment, filename, reportData } = emailOptions;

    // Validate email
    if (!validateEmail(to)) {
      throw new Error('Invalid recipient email address');
    }

    // Create transporter
    const transporter = createTransporter();

    // Generate HTML email body
    const htmlContent = generateEmailTemplate(reportType, reportData);

    // Determine MIME type based on report type
    const contentType = reportType.toLowerCase() === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // Email options
    const mailOptions = {
      from: {
        name: 'FinCopilot',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: filename,
          content: attachment,
          contentType: contentType
        }
      ]
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[EmailService] Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('[EmailService] Email send error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send multiple reports in a single email
 * @param {Object} emailOptions - Email configuration
 * @param {string} emailOptions.to - Recipient email
 * @param {string} emailOptions.subject - Email subject
 * @param {Array} emailOptions.attachments - Array of {buffer, filename, type}
 * @param {Object} emailOptions.reportData - Report data for email body
 * @returns {Object} Email send result
 */
async function sendMultipleReports(emailOptions) {
  try {
    const { to, subject, attachments, reportData } = emailOptions;

    // Validate email
    if (!validateEmail(to)) {
      throw new Error('Invalid recipient email address');
    }

    if (!attachments || attachments.length === 0) {
      throw new Error('No attachments provided');
    }

    // Create transporter
    const transporter = createTransporter();

    // Generate HTML email body
    const htmlContent = generateMultiReportTemplate(reportData, attachments.length);

    // Format attachments
    const formattedAttachments = attachments.map(att => {
      const contentType = att.type.toLowerCase() === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      return {
        filename: att.filename,
        content: att.buffer,
        contentType: contentType
      };
    });

    // Email options
    const mailOptions = {
      from: {
        name: 'FinCopilot',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: formattedAttachments
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[EmailService] Multiple reports sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('[EmailService] Multiple reports send error:', error.message);
    throw new Error(`Failed to send multiple reports: ${error.message}`);
  }
}

/**
 * Send scheduled report notification
 * @param {string} to - Recipient email
 * @param {string} reportName - Name of the scheduled report
 * @param {string} frequency - Report frequency (daily/weekly/monthly)
 * @param {Buffer} attachment - Report buffer
 * @param {string} filename - Attachment filename
 * @returns {Object} Email send result
 */
async function sendScheduledReport(to, reportName, frequency, attachment, filename) {
  try {
    // Validate email
    if (!validateEmail(to)) {
      throw new Error('Invalid recipient email address');
    }

    // Create transporter
    const transporter = createTransporter();

    // Generate HTML for scheduled report
    const htmlContent = generateScheduledReportTemplate(reportName, frequency);

    // Determine content type based on filename extension
    const contentType = filename.toLowerCase().endsWith('.pdf')
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // Email options
    const mailOptions = {
      from: {
        name: 'FinCopilot - Automated Reports',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: `[Scheduled] ${reportName} - ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report`,
      html: htmlContent,
      attachments: [
        {
          filename: filename,
          content: attachment,
          contentType: contentType
        }
      ]
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[EmailService] Scheduled report sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('[EmailService] Scheduled report error:', error.message);
    throw new Error(`Failed to send scheduled report: ${error.message}`);
  }
}

/**
 * Verify email configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
async function verifyEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[EmailService] Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[EmailService] Email configuration error:', error.message);
    return false;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate HTML template for single report email
 * @param {string} reportType - Type of report (PDF/Excel)
 * @param {Object} reportData - Report summary data
 * @returns {string} HTML content
 */
function generateEmailTemplate(reportType, reportData = {}) {
  const { period, totalIncome, totalExpenses, netSavings, transactionCount } = reportData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1F4788 0%, #2E5FA3 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .summary-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #1F4788;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .summary-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .value {
          color: #1F4788;
          font-weight: bold;
        }
        .positive {
          color: #28a745;
        }
        .negative {
          color: #dc3545;
        }
        .footer {
          background: #333;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #1F4788;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Financial Report</h1>
        <p>Your ${reportType} report is ready</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>Your financial report has been generated successfully. Please find the attached ${reportType} file with detailed information.</p>
        
        ${reportData && period ? `
        <div class="summary-box">
          <h3 style="margin-top: 0; color: #1F4788;">Report Summary</h3>
          ${period ? `<p><strong>Period:</strong> ${period}</p>` : ''}
          ${transactionCount !== undefined ? `
          <div class="summary-row">
            <span class="label">Total Transactions:</span>
            <span class="value">${transactionCount}</span>
          </div>
          ` : ''}
          ${totalIncome !== undefined ? `
          <div class="summary-row">
            <span class="label">Total Income:</span>
            <span class="value positive">₹${totalIncome}</span>
          </div>
          ` : ''}
          ${totalExpenses !== undefined ? `
          <div class="summary-row">
            <span class="label">Total Expenses:</span>
            <span class="value negative">₹${totalExpenses}</span>
          </div>
          ` : ''}
          ${netSavings !== undefined ? `
          <div class="summary-row">
            <span class="label">Net Savings:</span>
            <span class="value ${parseFloat(netSavings) >= 0 ? 'positive' : 'negative'}">₹${netSavings}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <p><strong>What's included:</strong></p>
        <ul>
          <li>Detailed transaction history</li>
          <li>Category-wise spending breakdown</li>
          <li>Budget performance analysis</li>
          <li>Financial insights and trends</li>
        </ul>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>FinCopilot Team</strong></p>
      </div>
      
      <div class="footer">
        <p>© 2026 FinCopilot - Your Personal Finance Assistant</p>
        <p style="font-size: 12px; margin-top: 10px;">This is an automated email. Please do not reply.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML template for multiple reports email
 * @param {Object} reportData - Report summary data
 * @param {number} attachmentCount - Number of attachments
 * @returns {string} HTML content
 */
function generateMultiReportTemplate(reportData = {}, attachmentCount) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1F4788 0%, #2E5FA3 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #28a745;
        }
        .footer {
          background: #333;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 Multiple Financial Reports</h1>
        <p>Your comprehensive report package is ready</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>Your financial reports have been generated successfully. This email contains <strong>${attachmentCount} report file(s)</strong> with comprehensive financial data.</p>
        
        <div class="info-box">
          <h3 style="margin-top: 0;">📎 Attachments Included</h3>
          <p>✓ ${attachmentCount} report file(s) attached to this email</p>
          <p>Each report contains detailed financial analysis for the selected period.</p>
        </div>
        
        <p>Use these reports to:</p>
        <ul>
          <li>Track your spending patterns</li>
          <li>Monitor budget performance</li>
          <li>Analyze financial goals progress</li>
          <li>Make informed financial decisions</li>
        </ul>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>FinCopilot Team</strong></p>
      </div>
      
      <div class="footer">
        <p>© 2026 FinCopilot - Your Personal Finance Assistant</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML template for scheduled report email
 * @param {string} reportName - Name of the report
 * @param {string} frequency - Report frequency
 * @returns {string} HTML content
 */
function generateScheduledReportTemplate(reportName, frequency) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .schedule-badge {
          display: inline-block;
          background: #ffc107;
          color: #333;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          margin: 10px 0;
        }
        .footer {
          background: #333;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 Scheduled Report</h1>
        <p>${reportName}</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>This is your automated <span class="schedule-badge">${frequency.toUpperCase()}</span> financial report.</p>
        
        <p>Your ${reportName} has been generated and is attached to this email. This report is automatically sent based on your scheduling preferences.</p>
        
        <p><strong>Report Details:</strong></p>
        <ul>
          <li>Report Type: ${reportName}</li>
          <li>Frequency: ${frequency}</li>
          <li>Generated: ${new Date().toLocaleString()}</li>
        </ul>
        
        <p>To modify or cancel scheduled reports, please update your preferences in your FinCopilot account.</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>FinCopilot Automated Reports</strong></p>
      </div>
      
      <div class="footer">
        <p>© 2026 FinCopilot - Your Personal Finance Assistant</p>
        <p style="font-size: 12px; margin-top: 10px;">This is an automated scheduled report.</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  sendReportEmail,
  sendMultipleReports,
  sendScheduledReport,
  verifyEmailConfig,
  validateEmail
};
