import apiClient from './apiClient';

// ============================================
// PDF REPORT DOWNLOADS
// ============================================

// Download Monthly PDF Report
export const downloadMonthlyPDF = async (month, year) => {
  try {
    const response = await apiClient.get('/reports/pdf/monthly', {
      params: { month, year },
      responseType: 'blob' // Important for file downloads
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Monthly_Report_${month}_${year}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading monthly PDF:', error);
    throw error;
  }
};

// Download Transaction PDF Report
export const downloadTransactionPDF = async (startDate, endDate) => {
  try {
    const response = await apiClient.get('/reports/pdf/transactions', {
      params: { startDate, endDate },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transactions_${startDate}_${endDate}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading transaction PDF:', error);
    throw error;
  }
};

// Download Budget PDF Report
export const downloadBudgetPDF = async () => {
  try {
    const response = await apiClient.get('/reports/pdf/budget', {
      responseType: 'blob'
    });

    const today = new Date().toISOString().split('T')[0];
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Budget_Report_${today}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading budget PDF:', error);
    throw error;
  }
};

// Download Custom PDF Report
export const downloadCustomPDF = async (filters) => {
  try {
    const response = await apiClient.post('/reports/pdf/custom', filters, {
      responseType: 'blob'
    });

    const today = new Date().toISOString().split('T')[0];
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Custom_Report_${today}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading custom PDF:', error);
    throw error;
  }
};

// ============================================
// EXCEL EXPORTS
// ============================================

// Download Transactions CSV
export const downloadTransactionsCSV = async (startDate, endDate) => {
  try {
    const response = await apiClient.get('/reports/export/csv', {
      params: { startDate, endDate },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transactions_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
};

// Download Transactions Excel
export const downloadTransactionsExcel = async (startDate, endDate) => {
  try {
    const response = await apiClient.get('/reports/export/excel', {
      params: { startDate, endDate },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transactions_${startDate}_${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading Excel:', error);
    throw error;
  }
};

// Download Analytics Excel
export const downloadAnalyticsExcel = async (params) => {
  try {
    const response = await apiClient.get('/reports/export/analytics', {
      params,
      responseType: 'blob'
    });

    const filename = params.month 
      ? `Analytics_${params.month}_${params.year}.xlsx`
      : `Analytics_${params.startDate}_${params.endDate}.xlsx`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading analytics:', error);
    throw error;
  }
};

// ============================================
// EMAIL REPORTS
// ============================================

// Send Report via Email
export const sendReportEmail = async (emailData) => {
  try {
    const response = await apiClient.post('/reports/email/send', emailData);
    return response.data.data;
  } catch (error) {
    console.error('Error sending report email:', error);
    throw error;
  }
};

// ============================================
// SCHEDULED REPORTS
// ============================================

// Create Scheduled Report
export const createScheduledReport = async (scheduleData) => {
  try {
    const response = await apiClient.post('/reports/schedule', scheduleData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

// Get User's Scheduled Reports
export const getScheduledReports = async () => {
  try {
    const response = await apiClient.get('/reports/schedule');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

// Update Scheduled Report
export const updateScheduledReport = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/reports/schedule/${id}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

// Delete Scheduled Report
export const deleteScheduledReport = async (id) => {
  try {
    const response = await apiClient.delete(`/reports/schedule/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get report types
export const getReportTypes = () => {
  return [
    { value: 'monthly', label: 'Monthly Report', icon: '📅' },
    { value: 'transactions', label: 'Transaction Report', icon: '💳' },
    { value: 'budget', label: 'Budget Report', icon: '💰' },
    { value: 'analytics', label: 'Analytics Report', icon: '📊' }
  ];
};

// Get report formats
export const getReportFormats = () => {
  return [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📑' }
  ];
};

// Get schedule frequencies
export const getScheduleFrequencies = () => {
  return [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];
};

// Get months
export const getMonths = () => {
  return [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
};

// Get current month and year
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

// Get last month
export const getLastMonth = () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    month: lastMonth.getMonth() + 1,
    year: lastMonth.getFullYear()
  };
};

// Get date range for current month
export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

// Get date range for last month
export const getLastMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};
