const express = require('express');
// using Prisma for DB queries now
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
console.log("FinCopilot Project Initialized Version 1.0.0");
// API routes
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
} );  

console.log("Server setup complete, starting to listen on port", port);
app.listen(port, () => {
  console.log(`FinCopilot Project is running at http://localhost:${port}`);
});