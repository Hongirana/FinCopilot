const request = require('supertest');
const app = require('../../../src/app');
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser, generateTestToken } = require('../../helpers/testData');

describe('Analytics API - Integration Tests', () => {
  let authToken;
  let userId;
  let accountId;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test user
    const user = await createTestUser(prisma);
    authToken = user.token || await generateTestToken(user.id);
    userId = user.id;

    // Create test account
    const account = await prisma.account.create({
      data: {
        userId: userId,
        name: 'Test Checking Account',
        type: 'checking',
        balance: 100000
      }
    });
    accountId = account.id;

    // Create test transactions for analytics
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    
    // Create income and expense transactions in current month
    const transactionData = [
        // Income transactions
        {
          userId: userId,
          accountId: accountId,
          type: 'credit',
          category: 'salary',
          amount: 50000,
          description: 'Monthly salary',
          date: new Date(currentYear, currentMonth, 1)
        },
        {
          userId: userId,
          accountId: accountId,
          type: 'credit',
          category: 'salary',
          amount: 10000,
          description: 'Freelance work',
          date: new Date(currentYear, currentMonth, 5)
        },
        // Expense transactions
        {
          userId: userId,
          accountId: accountId,
          type: 'debit',
          category: 'food',
          amount: 5000,
          description: 'Groceries',
          date: new Date(currentYear, currentMonth, 3)
        },
        {
          userId: userId,
          accountId: accountId,
          type: 'debit',
          category: 'food',
          amount: 3000,
          description: 'Restaurant dining',
          date: new Date(currentYear, currentMonth, 10)
        },
        {
          userId: userId,
          accountId: accountId,
          type: 'debit',
          category: 'transport',
          amount: 2000,
          description: 'Fuel',
          date: new Date(currentYear, currentMonth, 15)
        },
        {
          userId: userId,
          accountId: accountId,
          type: 'debit',
          category: 'entertainment',
          amount: 1500,
          description: 'Movie tickets',
          date: new Date(currentYear, currentMonth, 20)
        },
        {
          userId: userId,
          accountId: accountId,
          type: 'debit',
          category: 'shopping',
          amount: 4000,
          description: 'Clothing',
          date: new Date(currentYear, currentMonth, 25)
        }
      ]
      
      Promise.all(transactionData.map(transaction => prisma.transaction.create({ data: transaction })));

  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // ==================== GET /api/analytics/spending/category ====================
  describe('GET /api/analytics/spending/category', () => {
    test('should get category spending breakdown successfully', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/analytics/spending/category')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category spending fetched successfully');
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('totalSpending');
      expect(response.body.data).toHaveProperty('totalIncome');
      expect(response.body.data).toHaveProperty('netSavings');
      expect(response.body.data).toHaveProperty('categoryBreakdown');
      expect(Array.isArray(response.body.data.categoryBreakdown)).toBe(true);
      
      // Verify category breakdown has data
      expect(response.body.data.categoryBreakdown.length).toBeGreaterThan(0);
      
      // Verify first category structure
      const category = response.body.data.categoryBreakdown[0];
      expect(category).toHaveProperty('category');
      expect(category).toHaveProperty('amount');
      expect(category).toHaveProperty('percentage');
      expect(category).toHaveProperty('transactionCount');
      expect(category).toHaveProperty('averageTransaction');
    });

    test('should filter by account ID', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/analytics/spending/category')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate, accountId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categoryBreakdown');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/category')
        .query({ 
          startDate: '2026-01-01', 
          endDate: '2026-01-31' 
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid date range (start > end)', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/category')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          startDate: '2026-12-31', 
          endDate: '2026-01-01' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('greater than');
    });
  });

  // ==================== GET /api/analytics/spending/monthly ====================
  describe('GET /api/analytics/spending/monthly', () => {
    test('should get monthly report successfully', async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month, year })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Monthly report fetched successfully');
      expect(response.body.data).toHaveProperty('month', month);
      expect(response.body.data).toHaveProperty('year', year);
      expect(response.body.data).toHaveProperty('monthName');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('categoryBreakdown');
      expect(response.body.data).toHaveProperty('dailyStats');
      expect(response.body.data).toHaveProperty('comparison');
      
      // Verify summary structure
      expect(response.body.data.summary).toHaveProperty('totalIncome');
      expect(response.body.data.summary).toHaveProperty('totalExpenses');
      expect(response.body.data.summary).toHaveProperty('netSavings');
      expect(response.body.data.summary).toHaveProperty('savingsRate');
      
      // Verify daily stats
      expect(response.body.data.dailyStats).toHaveProperty('averageDailySpending');
      expect(response.body.data.dailyStats).toHaveProperty('daysInMonth');
    });

    test('should filter by account ID', async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month, year, accountId })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject request without month parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ year: 2026 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('month');
    });

    test('should reject request without year parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: 1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('year');
    });

    test('should reject invalid month (> 12)', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: 13, year: 2026 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('month');
    });

    test('should reject invalid month (< 1)', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: 0, year: 2026 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('month');
    });

    test('should reject invalid year (too old)', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: 1, year: 1899 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('year');
    });

    test('should reject invalid year (too future)', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: 1, year: 2101 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('year');
    });
  });

  // ==================== GET /api/analytics/top-categories ====================
  describe('GET /api/analytics/top-categories', () => {
    test('should get top categories successfully with default limit', async () => {
      const response = await request(app)
        .get('/api/analytics/top-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Top categories fetched successfully');
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('totalSpending');
      expect(response.body.data).toHaveProperty('topCategories');
      expect(Array.isArray(response.body.data.topCategories)).toBe(true);
      expect(response.body.data.topCategories.length).toBeLessThanOrEqual(5);
    });

    test('should respect custom limit', async () => {
      const response = await request(app)
        .get('/api/analytics/top-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topCategories.length).toBeLessThanOrEqual(3);
    });

    test('should respect custom date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/analytics/top-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate, limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period.startDate).toBe(startDate);
      expect(response.body.data.period.endDate).toBe(endDate);
    });

    test('should verify category structure', async () => {
      const response = await request(app)
        .get('/api/analytics/top-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.topCategories.length > 0) {
        const category = response.body.data.topCategories[0];
        expect(category).toHaveProperty('rank');
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('amount');
        expect(category).toHaveProperty('percentage');
        expect(category).toHaveProperty('transactionCount');
        expect(category.rank).toBe(1);
      }
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/top-categories')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/analytics/spending/yearly ====================
  describe('GET /api/analytics/spending/yearly', () => {
    test('should get yearly summary successfully', async () => {
      const year = new Date().getFullYear();

      const response = await request(app)
        .get('/api/analytics/spending/yearly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ year })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Yearly summary fetched successfully');
      expect(response.body.data).toHaveProperty('year', year);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('monthlyBreakdown');
      expect(response.body.data).toHaveProperty('topCategories');
      expect(response.body.data).toHaveProperty('quarterlyBreakdown');
      
      // Verify summary structure
      expect(response.body.data.summary).toHaveProperty('totalIncome');
      expect(response.body.data.summary).toHaveProperty('totalExpenses');
      expect(response.body.data.summary).toHaveProperty('netSavings');
      expect(response.body.data.summary).toHaveProperty('savingsRate');
      
      // Verify monthly breakdown is array
      expect(Array.isArray(response.body.data.monthlyBreakdown)).toBe(true);
      
      // Verify quarterly breakdown is array
      expect(Array.isArray(response.body.data.quarterlyBreakdown)).toBe(true);
      expect(response.body.data.quarterlyBreakdown.length).toBe(4);
    });

    test('should filter by account ID', async () => {
      const year = new Date().getFullYear();

      const response = await request(app)
        .get('/api/analytics/spending/yearly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ year, accountId })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject request without year parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/yearly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Year is required');
    });

    test('should reject invalid year', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/yearly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ year: 1800 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('year');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/yearly')
        .query({ year: 2026 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/analytics/trends ====================
  describe('GET /api/analytics/trends', () => {
    test('should get monthly spending trends successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'month', compare: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Spending trends fetched successfully');
      expect(response.body.data).toHaveProperty('period', 'month');
      expect(response.body.data).toHaveProperty('periodsCompared', 3);
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('overallTrend');
      expect(response.body.data).toHaveProperty('averageChange');
      
      // Verify trends array
      expect(Array.isArray(response.body.data.trends)).toBe(true);
      expect(response.body.data.trends.length).toBe(3);
      
      // Verify first trend structure
      if (response.body.data.trends.length > 0) {
        const trend = response.body.data.trends[0];
        expect(trend).toHaveProperty('totalExpenses');
        expect(trend).toHaveProperty('changeFromPrevious');
        expect(trend).toHaveProperty('trend');
        expect(trend).toHaveProperty('startDate');
        expect(trend).toHaveProperty('endDate');
      }
    });

    test('should get weekly trends', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'week', compare: 4 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('week');
      expect(response.body.data.periodsCompared).toBe(4);
    });

    test('should get yearly trends', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'year', compare: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('year');
      expect(response.body.data.periodsCompared).toBe(2);
    });

    test('should use default compare value when not provided', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'month' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.periodsCompared).toBe(3);
    });

    test('should reject invalid period', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'day' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid period');
    });

    test('should reject request without period parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid period');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .query({ period: 'month' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/analytics/spending/range ====================
  describe('GET /api/analytics/spending/range', () => {
    test('should get date range report successfully', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/analytics/spending/range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Date range report fetched successfully');
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('categoryBreakdown');
      
      // Verify period
      expect(response.body.data.period).toHaveProperty('startDate', startDate);
      expect(response.body.data.period).toHaveProperty('endDate', endDate);
      expect(response.body.data.period).toHaveProperty('days');
      
      // Verify summary
      expect(response.body.data.summary).toHaveProperty('totalIncome');
      expect(response.body.data.summary).toHaveProperty('totalExpenses');
      expect(response.body.data.summary).toHaveProperty('netSavings');
      expect(response.body.data.summary).toHaveProperty('dailyAverage');
      expect(response.body.data.summary).toHaveProperty('savingsRate');
      
      // Verify category breakdown
      expect(Array.isArray(response.body.data.categoryBreakdown)).toBe(true);
    });

    test('should filter by account ID', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/analytics/spending/range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate, accountId })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject request without startDate', async () => {
      const endDate = '2026-01-31';

      const response = await request(app)
        .get('/api/analytics/spending/range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ endDate })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });

    test('should reject request without endDate', async () => {
      const startDate = '2026-01-01';

      const response = await request(app)
        .get('/api/analytics/spending/range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });

    test('should reject invalid date range (start > end)', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          startDate: '2026-12-31', 
          endDate: '2026-01-01' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('greater than');
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/spending/range')
        .query({ 
          startDate: '2026-01-01', 
          endDate: '2026-01-31' 
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
