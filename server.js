//Importing common modules
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

//Importing Routes
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const signUpRoutes = require('./src/routes/signUpRoutes');
const loginRoutes = require('./src/routes/loginRoutes');



app.use(express.json());
console.log("FinCopilot Project Initialized Version 1.0.0");

// API routes for Authentication
app.use('/api/signUp', signUpRoutes);
app.use('/api/logIn', loginRoutes);

// API routes for Table 
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

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