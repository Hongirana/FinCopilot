// tests/integration/dashboard.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser } = require('../../helpers/testData');

describe('Dashboard API - Integration Tests', () => {
  let authToken;
  let userId;
  let testAccount;

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create user and get token
    const user = await createTestUser(prisma);
    userId = user.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@fincopilot.com',
        password: 'Test123!@#'
      });

    authToken = loginResponse.body.data.token;

    // Create test account
    testAccount = await prisma.account.create({
      data: {
        userId: userId,
        name: 'Test Account',
        type: 'savings',
        balance: 50000,
        currency: 'INR'
      }
    });

    // Create test transactions for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    await Promise.all([
      // Income transactions
      prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'credit',
          category: 'salary',
          amount: 50000,
          description: 'Monthly salary',
          date: new Date(startOfMonth.getTime() + 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'credit',
          category: 'other',
          amount: 10000,
          description: 'Bonus',
          date: new Date(startOfMonth.getTime() + 5 * 24 * 60 * 60 * 1000)
        }
      }),
      // Expense transactions
      prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'debit',
          category: 'food',
          amount: 8000,
          description: 'Groceries',
          date: new Date(startOfMonth.getTime() + 3 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'debit',
          category: 'rent',
          amount: 15000,
          description: 'Monthly rent',
          date: new Date(startOfMonth.getTime() + 1 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'debit',
          category: 'transport',
          amount: 5000,
          description: 'Fuel',
          date: new Date(startOfMonth.getTime() + 4 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    // Create test budget
    await prisma.budget.create({
      data: {
        userId: userId,
        category: 'food',
        amount: 15000,
        spent: 8000,
        period: 'MONTHLY',
        startDate: startOfMonth,
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
    });

    // Create test goal
    await prisma.goal.create({
      data: {
        userId: userId,
        title: 'Emergency Fund',
        targetAmount: 100000,
        currentAmount: 50000,
        deadline: new Date(now.getFullYear() + 1, 11, 31),
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/dashboard/summary', () => {
    test('should get dashboard summary successfully', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.summary).toBeDefined();

      // Verify summary structure matches Day 11 Block A design
      const summary = response.body.data.summary;
      expect(summary).toHaveProperty('currentMonth');
      expect(summary).toHaveProperty('previousMonth');
      expect(summary).toHaveProperty('budgetOverview');
      expect(summary).toHaveProperty('goalsOverview');
      expect(summary).toHaveProperty('accounts');
    });

    test('should return correct current month data structure', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const currentMonth = response.body.data.summary.currentMonth;

      // Verify structure
      expect(currentMonth).toHaveProperty('month');
      expect(currentMonth).toHaveProperty('year');
      expect(currentMonth).toHaveProperty('monthName');
      expect(currentMonth).toHaveProperty('totalIncome');
      expect(currentMonth).toHaveProperty('totalExpenses');
      expect(currentMonth).toHaveProperty('netSavings');
      expect(currentMonth).toHaveProperty('savingsRate');

      // Verify calculations
      // Total income = 50000 + 10000 = 60000
      expect(Number(currentMonth.totalIncome)).toBe(60000);

      // Total expenses = 8000 + 15000 + 5000 = 28000
      expect(Number(currentMonth.totalExpenses)).toBe(28000);

      // Net savings = 60000 - 28000 = 32000
      expect(Number(currentMonth.netSavings)).toBe(32000);
    });

    test('should return previous month comparison', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const previousMonth = response.body.data.summary.previousMonth;

      expect(previousMonth).toHaveProperty('month');
      expect(previousMonth).toHaveProperty('year');
      expect(previousMonth).toHaveProperty('prevExpenses');
      expect(previousMonth).toHaveProperty('change');
      expect(previousMonth).toHaveProperty('changeAmount');
    });

    test('should return budget overview', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const budgetOverview = response.body.data.summary.budgetOverview;

      expect(budgetOverview).toHaveProperty('totalBudgets');
      expect(budgetOverview).toHaveProperty('activeBudgets');
      expect(budgetOverview).toHaveProperty('totalBudgetAmount');
      expect(budgetOverview).toHaveProperty('totalSpent');
      expect(budgetOverview).toHaveProperty('remainingBudget');
      expect(budgetOverview).toHaveProperty('budgetUtilization');

      expect(Number(budgetOverview.totalBudgets)).toBeGreaterThanOrEqual(1);
    });

    test('should return goals overview', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const goalsOverview = response.body.data.summary.goalsOverview;

      expect(goalsOverview).toHaveProperty('totalGoals');
      expect(goalsOverview).toHaveProperty('activeGoals');
      expect(goalsOverview).toHaveProperty('completedGoals');
      expect(goalsOverview).toHaveProperty('totalTargetAmount');
      expect(goalsOverview).toHaveProperty('totalCurrentAmount');
      expect(goalsOverview).toHaveProperty('overallProgress');

      expect(Number(goalsOverview.totalGoals)).toBeGreaterThanOrEqual(1);
    });

    test('should return accounts summary', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const accounts = response.body.data.summary.accounts;

      expect(accounts).toHaveProperty('totalAccounts');
      expect(accounts).toHaveProperty('totalBalance');
      expect(accounts).toHaveProperty('accounts');
      expect(Array.isArray(accounts.accounts)).toBe(true);

      expect(Number(accounts.totalAccounts)).toBe(1);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    test('should get financial stats successfully', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.financialStats).toBeDefined();

      // Verify structure
      const stats = response.body.data.financialStats;
      expect(stats.netWorth).toBeDefined();
      expect(stats.cashFlow).toBeDefined();
      expect(stats.spendingVelocity).toBeDefined();
      expect(stats.savingsMetrics).toBeDefined();
      expect(stats.topExpenseCategories).toBeDefined();
      expect(Array.isArray(stats.topExpenseCategories)).toBe(true);
    });

    test('should calculate net worth correctly', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const netWorth = response.body.data.financialStats.netWorth;

      expect(netWorth.total).toBeDefined();
      expect(netWorth.breakdown).toBeDefined();
      expect(netWorth.breakdown.assets).toBeDefined();
      expect(netWorth.breakdown.liabilities).toBeDefined();

      // Assets = 50000 (account balance)
      expect(Number(netWorth.breakdown.assets)).toBe(50000);
    });

    test('should calculate savings rate', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const savingsMetrics = response.body.data.financialStats.savingsMetrics;

      expect(savingsMetrics.savingsRate).toBeDefined();
      expect(Number(savingsMetrics.savingsRate)).toBeGreaterThanOrEqual(0);
      expect(Number(savingsMetrics.savingsRate)).toBeLessThanOrEqual(100);

      // Verify calculation makes sense
      expect(savingsMetrics.currentMonthSavings).toBeDefined();
      expect(savingsMetrics.last3MonthsAverage).toBeDefined();
      expect(savingsMetrics.savingsTrend).toMatch(/^(increasing|decreasing|stable)$/);
    });
  });

  describe('GET /api/dashboard/overview', () => {
    test('should get quick overview successfully', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Verify all sections exist
      expect(response.body.data.accountsOverview).toBeDefined();
      expect(response.body.data.budgetsOverview).toBeDefined();
      expect(response.body.data.goalsOverview).toBeDefined();
      expect(response.body.data.transactionsOverview).toBeDefined();
      expect(response.body.data.recentTransactions).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
    });

    test('should return recent transactions', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recentTransactions = response.body.data.recentTransactions;

      expect(Array.isArray(recentTransactions)).toBe(true);
      expect(recentTransactions.length).toBeGreaterThan(0);
      expect(recentTransactions.length).toBeLessThanOrEqual(5);

      // Verify transaction structure
      if (recentTransactions.length > 0) {
        const txn = recentTransactions[0];
        expect(txn).toHaveProperty('id');
        expect(txn).toHaveProperty('type');
        expect(txn).toHaveProperty('category');
        expect(txn).toHaveProperty('amount');
        expect(txn).toHaveProperty('date');
      }
    });
  });
});
