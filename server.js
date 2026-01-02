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
const dashboardRoutes = require('./src/routes/dashboardRoutes');


//Importing Middleware
// const errorHandlerMiddleware = require('./src/middleware/errorHandlingMiddleware');
const {
  errorHandler,
  notFoundHandler,
  requestLogger
} = require('./src/middleware/errorHandler');


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
app.use('/api/dashboard', dashboardRoutes);

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


app.listen(port, () => {
  console.log(`FinCopilot Project is running at http://localhost:${port}`);
});