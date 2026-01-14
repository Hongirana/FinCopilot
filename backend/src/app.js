//This file exists only for Testing purposes
const express = require('express');
const app = express();

//Importing Routes
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

//Importing Middleware
const {
  errorHandler,
  notFoundHandler,
  requestLogger
} = require('./middleware/errorHandler');

app.use(express.json());
app.use(requestLogger);

// API routes for Authentication
app.use('/api/auth', authRoutes);

// API routes for resources
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Sample routes
app.get('/', (req, res) => {
  res.send('Welcome to the FinCopilot Project!');
});

app.post('/update', (req, res) => {
  res.send('Financial data analysis in progress...');
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
