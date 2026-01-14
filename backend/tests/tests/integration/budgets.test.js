const request = require('supertest');
const app = require('../../../src/app'); // ✅ CORRECTED PATH
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser } = require('../../helpers/testData');

describe('Budgets API - Integration Tests', () => {

  let authToken;
  let userId;

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
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/budgets', () => {

    test('should create a new budget successfully', async () => {
      const newBudget = {
        category: 'food',
        amount: 15000,
        period: 'MONTHLY',
        startDate: '2026-01-01', // ✅ Direct string
        endDate: '2026-01-31'
      };

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBudget)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.budget).toBeDefined();
      expect(response.body.data.budget.category).toBe(newBudget.category);
      expect(Number(response.body.data.budget.amount)).toBe(newBudget.amount);

      // Verify in database
      const budgetInDb = await prisma.budget.findFirst({
        where: { userId: userId }
      });
      expect(budgetInDb).toBeDefined();
      expect(budgetInDb.category).toBe(newBudget.category);
    });

    test('should reject budget creation without authentication', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .send({
          category: 'food',
          amount: 10000,
          period: 'MONTHLY'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject budget with missing required fields', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'food'
          // Missing amount, period
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject budget with invalid category', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'invalid_category',
          amount: 10000,
          period: 'MONTHLY',
          startDate: new Date(),
          endDate: new Date()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject budget with negative amount', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'food',
          amount: -5000,
          period: 'MONTHLY',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should create budget with spent initialized to 0', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'transport',
          amount: 5000,
          period: 'MONTHLY',
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        })
        .expect(201);

      expect(Number(response.body.data.budget.spent)).toBe(0);
    });
  });

  describe('GET /api/budgets', () => {

    beforeEach(async () => {
      // Create multiple test budgets
      let budgetdata = [
        {
          userId: userId,
          category: 'food',
          amount: 15000,
          spent: 8000,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        },
        {
          userId: userId,
          category: 'transport',
          amount: 5000,
          spent: 2500,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        },
        {
          userId: userId,
          category: 'entertainment',
          amount: 8000,
          spent: 7500,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        }
      ]

      await Promise.all(
        budgetdata.map(data => prisma.budget.create({ data: data }))
      );

    });

    test('should get all user budgets', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      console.log(response.body);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.budgets)).toBe(true);
      expect(response.body.data.budgets.length).toBe(3);
    });

    test('should include budget utilization percentage', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const foodBudget = response.body.data.budgets.find(b => b.category === 'food');
      // 8000/15000 * 100 = 53.33%
      expect(foodBudget.percentSpent).toBeDefined();
      expect(Number(foodBudget.percentSpent)).toBeCloseTo(53.33, 1);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/budgets/:id', () => {

    let budgetId;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          userId: userId,
          category: 'food',
          amount: 10000,
          spent: 5000,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        }
      });
      budgetId = budget.id;
    });

    test('should get budget by ID', async () => {
      const response = await request(app)
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budget).toBeDefined();
      expect(response.body.data.budget.id).toBe(budgetId);
      expect(response.body.data.budget.category).toBe('food');
    });

    test('should return 404 for non-existent budget', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/budgets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/budgets/:id', () => {

    let budgetId;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          userId: userId,
          category: 'food',
          amount: 10000,
          spent: 5000,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        }
      });
      budgetId = budget.id;
    });

    test('should update budget successfully', async () => {
      const updates = {
        amount: 15000,
        category: 'food',
        period: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2026-01-31'
      };

      const response = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Number(response.body.data.budget.amount)).toBe(updates.amount);

      // Verify in database
      const updatedBudget = await prisma.budget.findUnique({
        where: { id: budgetId }
      });
      expect(Number(updatedBudget.amount)).toBe(updates.amount);
    });

    test('should return 404 when updating non-existent budget', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .put(`/api/budgets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 20000 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/budgets/:id', () => {

    let budgetId;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          userId: userId,
          category: 'food',
          amount: 10000,
          spent: 5000,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        }
      });
      budgetId = budget.id;
    });

    test('should delete budget successfully', async () => {
      const response = await request(app)
        .delete(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted from database
      const deletedBudget = await prisma.budget.findUnique({
        where: { id: budgetId }
      });
      expect(deletedBudget).toBeNull();
    });

    test('should return 404 when deleting non-existent budget', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/budgets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/budgets/alerts', () => {

    beforeEach(async () => {
      // Create budgets with different utilization levels
      await prisma.budget.createMany({
        data: [
          {
            userId: userId,
            category: 'food',
            amount: 10000,
            spent: 9500, // 95% - Over 80%
            period: 'MONTHLY',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31')
          },
          {
            userId: userId,
            category: 'transport',
            amount: 5000,
            spent: 2500, // 50% - Normal
            period: 'MONTHLY',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31')
          },
          {
            userId: userId,
            category: 'entertainment',
            amount: 8000,
            spent: 8500, // 106% - Over budget
            period: 'MONTHLY',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31')
          }
        ]
      });
    });

    test('should get budget alerts for high utilization', async () => {
      const response = await request(app)
        .get('/api/budgets/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      // Should have alerts for food (95%) and entertainment (106%)
      expect(response.body.data.alerts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/budgets/recalculate', () => {

    let accountId;

    beforeEach(async () => {
      // Create account
      const account = await prisma.account.create({
        data: {
          userId: userId,
          name: 'Test Account',
          type: 'savings',
          balance: 50000,
          currency: 'INR'
        }
      });
      accountId = account.id;

      // Create budget
      await prisma.budget.create({
        data: {
          userId: userId,
          category: 'food',
          amount: 10000,
          spent: 0,
          period: 'MONTHLY',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        }
      });

      // Create transactions
      await prisma.transaction.createMany({
        data: [
          {
            userId: userId,
            accountId: accountId,
            type: 'debit',
            amount: 1000,
            category: 'food',
            date: new Date('2026-01-15')
          },
          {
            userId: userId,
            accountId: accountId,
            type: 'debit',
            amount: 1500,
            category: 'food',
            date: new Date('2026-01-20')
          }
        ]
      });
    });

    test('should recalculate all user budgets', async () => {
      const response = await request(app)
        .post('/api/budgets/recalculate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recalculated).toBeDefined();

      // Verify budget spent was updated
      const budget = await prisma.budget.findFirst({
        where: { userId: userId, category: 'food' }
      });
      expect(Number(budget.spent)).toBe(2500); // 1000 + 1500
    });

    afterAll(async () => {
      await disconnectDatabase();
    });
  });
});
