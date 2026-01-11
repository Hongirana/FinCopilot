// require('dotenv').config();
// const aiService = require('./src/services/aiServices');

// async function testCategorization() {
//   console.log('🧪 Testing FinCopilot AI Categorization\n');
  
//   const testCases = [
//     {
//       id: 1,
//       description: 'Swiggy food order',
//       amount: 350,
//       merchant: 'Swiggy',
//       type: 'expense'
//     },
//     {
//       id: 2,
//       description: 'Monthly salary credit',
//       amount: 75000,
//       merchant: 'Infosys Ltd',
//       type: 'income'
//     },
//     {
//       id: 3,
//       description: 'Petrol pump',
//       amount: 500,
//       merchant: 'HP Petrol',
//       type: 'expense'
//     }
//   ];

//   for (const tx of testCases) {
//     console.log(`\n📝 Testing: ${tx.description}`);
//     const result = await aiService.categorizeTransaction(tx);
//     console.log('Result:', result);
//     console.log('---');
//   }
// }

// testCategorization().catch(console.error);
const transactionsCount = 11;
const income = 50000;
const expenses = 10000;
// (transactionsCount > 0 ? ( (reportData.totalIncome + reportData.totalExpenses) / transactionsCount ) : 0);
const avgTransaction = (transactionsCount > 0 ? ( (income + expenses) / transactionsCount ).toFixed(2) : 0);  
        console.log('avgTransaction' , avgTransaction);