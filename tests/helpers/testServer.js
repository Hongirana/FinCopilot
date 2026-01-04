const express = require('express');

// Import your routes
const transactionRoutes = require('../../src/routes/transactionRoutes');
const budgetRoutes = require('../../src/routes/budgetRoutes');
const goalRoutes = require('../../src/routes/goalsRoutes');
const accountRoutes = require('../../src/routes/accountRoutes');
const authRoutes = require('../../src/routes/authRoutes');
const userRoutes = require('../../src/routes/userRoutes');
const analyticsRoutes = require('../../src/routes/analyticsRoutes');
const dashboardRoutes = require('../../src/routes/dashboardRoutes');

// Import middleware
const { errorHandler } = require('../../src/middleware/errorHandler');

/**
 * Create Express 5.x app for testing
 * Supertest 7.x compatible
 */
function createTestApp() {
  const app = express();
  
  // Express 5.x body parsing (built-in)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      message: 'Test server running',
      express: '5.x',
      timestamp: new Date().toISOString()
    });
  });
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/goals', goalRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.path 
    });
  });
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  return app;
}

module.exports = { createTestApp };
