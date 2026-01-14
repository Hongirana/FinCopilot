//Importing common modules
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


//Importing Routes
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const authRoutes = require('./src/routes/authRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const budgetRoutes = require('./src/routes/budgetRoutes');
const goalRoutes = require('./src/routes/goalsRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const advancedanalyticsRoutes = require('./src/routes/advancedAnalyticsRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

//Importing Middleware
// const errorHandlerMiddleware = require('./src/middleware/errorHandlingMiddleware');
const {
  errorHandler,
  notFoundHandler,
  requestLogger
} = require('./src/middleware/errorHandler');

//Importing Services to run upon startup.
// Import Redis and scheduled reports
const { isRedisConnected } = require('./src/config/redisClient');
const { initializeScheduledReports, stopAllScheduledReports } = require('./src/services/scheduledReportService');



app.use(express.json());
app.use(requestLogger);
console.log("FinCopilot Project Initialized Version 1.0.0");

// API routes for Authentication
app.use('/api/auth', authRoutes);

// API routes for Table 
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/advanced-analytics', advancedanalyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);


//Api routes for Middleware testing


// Sample route to test the server
app.get('/', (req, res) => {
  res.send('Welcome to the FinCopilot Project!');
});

app.post('/update', (req, res) => {
  // Placeholder for financial data analysis logic
  res.send('Financial data analysis in progress...');
});

// app.use(errorHandlerMiddleware);
app.use(notFoundHandler);

// Global Error Handler (must be LAST middleware)
app.use(errorHandler);


app.listen(port, async () => {
  console.log(`FinCopilot Project is running at http://localhost:${port}`);
  if (isRedisConnected()) {
    console.log('✅ Redis connected - Caching enabled');
  } else {
    console.warn('⚠️  Redis not connected - Caching disabled');
  }

  // Initialize scheduled reports
  try {
    await initializeScheduledReports();
    console.log('✅ Scheduled reports initialized');
  } catch (error) {
    console.error('❌ Failed to initialize scheduled reports:', error.message);
  }
});


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  stopAllScheduledReports();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  stopAllScheduledReports();
  process.exit(0);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;