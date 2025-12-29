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


//Importing Middleware
const errorHandlerMiddleware = require('./src/middleware/errorHandlingMiddleware');
const errorHandler = require('./middleware/errorHandler');

app.use(express.json());
console.log("FinCopilot Project Initialized Version 1.0.0");

// API routes for Authentication
app.use('/api/auth', authRoutes);

// API routes for Table 
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);

//Api routes for Middleware testing
app.use(errorHandlerMiddleware);
app.use(errorHandler);


// Sample route to test the server
app.get('/', (req, res) => {
  res.send('Welcome to the FinCopilot Project!');
});

app.post('/update', (req, res) => {
  // Placeholder for financial data analysis logic
  res.send('Financial data analysis in progress...');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`FinCopilot Project is running at http://localhost:${port}`);
});