const prisma = require('../src/prismaClient');

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.categoryFeedback.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.scheduledReport.deleteMany();
  await prisma.savedFilter.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Test password (plain text - hash in production!)
  const password = 'Test@123';

  // Create Test Users
  const user1 = await prisma.user.create({
    data: {
      firstName: 'Kiran',
      lastName: 'Kumar',
      email: 'kiran@test.com',
      password: password,
      baseCurrency: 'INR',
      monthlySalary: 75000,
      phoneNo: '+919876543210',
      payday: 1,
      role: 'user',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@test.com',
      password: password,
      baseCurrency: 'INR',
      monthlySalary: 85000,
      phoneNo: '+919876543211',
      payday: 5,
      role: 'user',
    },
  });

  console.log('✅ Created 2 test users');
  console.log(`   Email: kiran@test.com | Password: Test@123`);
  console.log(`   Email: priya@test.com | Password: Test@123`);

  // ✅ FIXED: All account balances are now positive (credit card shown as 0 initial balance)
  // The transactions will update the balance correctly
  const account1 = await prisma.account.create({
    data: {
      userId: user1.id,
      name: 'HDFC Savings',
      type: 'savings',
      balance: 0,  // ✅ Start from 0, transactions will update
      bankName: 'HDFC Bank',
      currency: 'INR',
    },
  });

  const account2 = await prisma.account.create({
    data: {
      userId: user1.id,
      name: 'SBI Checking',
      type: 'checking',
      balance: 0,  // ✅ Start from 0
      bankName: 'State Bank of India',
      currency: 'INR',
    },
  });

  const account3 = await prisma.account.create({
    data: {
      userId: user1.id,
      name: 'ICICI Credit Card',
      type: 'credit_card',
      balance: 0,  // ✅ Start from 0 (not negative)
      bankName: 'ICICI Bank',
      currency: 'INR',
    },
  });

  const account4 = await prisma.account.create({
    data: {
      userId: user2.id,
      name: 'Axis Savings',
      type: 'savings',
      balance: 0,  // ✅ Start from 0
      bankName: 'Axis Bank',
      currency: 'INR',
    },
  });

  console.log('✅ Created 4 accounts');

  // ✅ FIXED: All transaction amounts are now POSITIVE
  // Type (credit/debit) determines the direction
  const transactions = [];

  // January 2026 Transactions - ALL POSITIVE AMOUNTS
  const jan2026 = [
    { desc: 'Monthly Salary', amount: 75000, type: 'credit', category: 'salary', date: '2026-01-01', merchant: 'Infosys Ltd' },
    { desc: 'Rent Payment', amount: 18000, type: 'debit', category: 'rent', date: '2026-01-02', merchant: 'Landlord' },  // ✅ Changed to positive
    { desc: 'Electricity Bill', amount: 1200, type: 'debit', category: 'utilities', date: '2026-01-03', merchant: 'BESCOM' },  // ✅ Positive
    { desc: 'Starbucks Coffee', amount: 450, type: 'debit', category: 'food', date: '2026-01-04', merchant: 'Starbucks' },  // ✅ Positive
    { desc: 'Uber Ride', amount: 280, type: 'debit', category: 'transport', date: '2026-01-05', merchant: 'Uber' },  // ✅ Positive
    { desc: 'Flipkart Shopping', amount: 3500, type: 'debit', category: 'shopping', date: '2026-01-06', merchant: 'Flipkart' },  // ✅ Positive
    { desc: 'Movie Tickets', amount: 800, type: 'debit', category: 'entertainment', date: '2026-01-07', merchant: 'PVR Cinemas' },  // ✅ Positive
    { desc: 'Grocery Shopping', amount: 4500, type: 'debit', category: 'food', date: '2026-01-08', merchant: 'Big Bazaar' },  // ✅ Positive
    { desc: 'Swiggy Food Order', amount: 650, type: 'debit', category: 'food', date: '2026-01-09', merchant: 'Swiggy' },  // ✅ Positive
    { desc: 'Bike Service', amount: 2800, type: 'debit', category: 'transport', date: '2026-01-10', merchant: 'Yamaha Service' },  // ✅ Positive
    { desc: 'Health Insurance', amount: 5000, type: 'debit', category: 'insurance', date: '2026-01-11', merchant: 'HDFC Life' },  // ✅ Positive
  ];

  // December 2025 Transactions - ALL POSITIVE AMOUNTS
  const dec2025 = [
    { desc: 'Monthly Salary', amount: 75000, type: 'credit', category: 'salary', date: '2025-12-01', merchant: 'Infosys Ltd' },
    { desc: 'Rent Payment', amount: 18000, type: 'debit', category: 'rent', date: '2025-12-02', merchant: 'Landlord' },  // ✅ Positive
    { desc: 'Electricity Bill', amount: 1350, type: 'debit', category: 'utilities', date: '2025-12-05', merchant: 'BESCOM' },  // ✅ Positive
    { desc: 'Christmas Shopping', amount: 8500, type: 'debit', category: 'shopping', date: '2025-12-23', merchant: 'Amazon' },  // ✅ Positive
    { desc: 'New Year Party', amount: 3500, type: 'debit', category: 'entertainment', date: '2025-12-31', merchant: 'Club Cubana' },  // ✅ Positive
  ];

  // November 2025 Transactions - ALL POSITIVE AMOUNTS
  const nov2025 = [
    { desc: 'Monthly Salary', amount: 75000, type: 'credit', category: 'salary', date: '2025-11-01', merchant: 'Infosys Ltd' },
    { desc: 'Rent Payment', amount: 18000, type: 'debit', category: 'rent', date: '2025-11-02', merchant: 'Landlord' },  // ✅ Positive
    { desc: 'Diwali Shopping', amount: 12000, type: 'debit', category: 'shopping', date: '2025-11-10', merchant: 'Myntra' },  // ✅ Positive
  ];

  const allTransactions = [...jan2026, ...dec2025, ...nov2025];

   let account1Balance = 0;

  for (const txn of allTransactions) {
    const transaction = await prisma.transaction.create({
      data: {
        userId: user1.id,
        accountId: account1.id,
        amount: txn.amount,  // ✅ All positive now!
        type: txn.type,
        category: txn.category,
        merchant: txn.merchant,
        description: txn.desc,
        date: new Date(txn.date),
      },
    });
    transactions.push(transaction);

    if (txn.type === 'credit') {
      account1Balance += txn.amount;  // Add income
    } else {
      account1Balance -= txn.amount;  // Subtract expense
    }
  }

   await prisma.account.update({
    where: { id: account1.id },
    data: { balance: account1Balance }
  });

  console.log(`✅ Created ${allTransactions.length} transactions (all with positive amounts)`);
  console.log(`✅ Updated HDFC Savings balance: ₹${account1Balance.toLocaleString('en-IN')}`);

  // Create Budgets for User 1
  await prisma.budget.create({
    data: {
      userId: user1.id,
      category: 'food',
      amount: 10000,
      spent: 0,  // Will be calculated by budgetTracker
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    },
  });

  await prisma.budget.create({
    data: {
      userId: user1.id,
      category: 'transport',
      amount: 5000,
      spent: 0,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    },
  });

  await prisma.budget.create({
    data: {
      userId: user1.id,
      category: 'entertainment',
      amount: 3000,
      spent: 0,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    },
  });

  await prisma.budget.create({
    data: {
      userId: user1.id,
      category: 'shopping',
      amount: 8000,
      spent: 0,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    },
  });

  console.log('✅ Created 4 budgets');

  // Create Goals for User 1
  await prisma.goal.create({
    data: {
      userId: user1.id,
      title: 'Emergency Fund',
      description: 'Build 6 months emergency fund',
      targetAmount: 450000,
      currentAmount: 125000,
      deadline: new Date('2026-12-31'),
      status: 'ACTIVE',
      category: 'savings',
      priority: 'high',
    },
  });

  await prisma.goal.create({
    data: {
      userId: user1.id,
      title: 'New Motorcycle',
      description: 'Save for Royal Enfield Interceptor 650',
      targetAmount: 350000,
      currentAmount: 80000,
      deadline: new Date('2026-08-15'),
      status: 'ACTIVE',
      category: 'vehicle',
      priority: 'medium',
    },
  });

  await prisma.goal.create({
    data: {
      userId: user1.id,
      title: 'Chikmagalur Trip',
      description: 'Weekend bike trip to Chikmagalur',
      targetAmount: 15000,
      currentAmount: 15000,
      deadline: new Date('2026-02-28'),
      status: 'COMPLETED',
      category: 'travel',
      priority: 'low',
    },
  });

  console.log('✅ Created 3 goals');

  // Create Saved Filters
  await prisma.savedFilter.create({
    data: {
      userId: user1.id,
      name: 'Monthly Food Expenses',
      description: 'All food and dining expenses for current month',
      criteria: {
        category: 'food',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        type: 'debit',
      },
      isDefault: true,
    },
  });

  await prisma.savedFilter.create({
    data: {
      userId: user1.id,
      name: 'Large Transactions',
      description: 'Transactions above 5000 INR',
      criteria: {
        minAmount: 5000,
        type: 'debit',
      },
      isDefault: false,
    },
  });

  console.log('✅ Created 2 saved filters');

  // Create Scheduled Reports
  await prisma.scheduledReport.create({
    data: {
      userId: user1.id,
      reportType: 'monthly',
      format: 'pdf',
      frequency: 'monthly',
      cronExpression: '0 9 1 * *', // 9 AM on 1st of every month
      filters: {
        includeCharts: true,
        includeBudgets: true,
      },
      isActive: true,
    },
  });

  console.log('✅ Created 1 scheduled report');

  // Create Category Feedback (AI learning data)
  await prisma.categoryFeedback.create({
    data: {
      userId: user1.id,
      transactionId: transactions[3].id, // Starbucks
      suggestedCategory: 'food',
      actualCategory: 'food',
      confidence: 0.95,
      isCorrect: true,
    },
  });

  await prisma.categoryFeedback.create({
    data: {
      userId: user1.id,
      transactionId: transactions[5].id, // Flipkart
      suggestedCategory: 'entertainment',
      actualCategory: 'shopping',
      confidence: 0.65,
      isCorrect: false,
    },
  });

  console.log('✅ Created 2 category feedbacks');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 2 Users');
  console.log('   - 4 Accounts (all starting at 0)');
  console.log(`   - ${allTransactions.length} Transactions (ALL POSITIVE AMOUNTS)`);
  console.log('   - 4 Budgets');
  console.log('   - 3 Goals');
  console.log('   - 2 Saved Filters');
  console.log('   - 1 Scheduled Report');
  console.log('   - 2 Category Feedbacks\n');
  console.log('🔐 Test Login Credentials:');
  console.log('   Email: kiran@test.com');
  console.log('   Password: Test@123\n');
  console.log('💡 Note: All transaction amounts are positive.');
  console.log('   Transaction type (credit/debit) determines balance changes.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
