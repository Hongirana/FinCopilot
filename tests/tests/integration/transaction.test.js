const request = require('supertest');
const app = require('../../../src/app'); // ✅ CORRECTED PATH
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser, createTestAccount } = require('../../helpers/testData');

describe('Transactions API - Integration Tests', () => {
  
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
    testAccount = await createTestAccount(prisma, userId);
  });
  
  afterAll(async () => {
    await disconnectDatabase();
  });
  
  describe('POST /api/transactions', () => {
    
    test('should create a new transaction successfully', async () => {
      const newTransaction = {
        accountId: testAccount.id,
        type: 'debit',
        amount: 1500.50,
        category: 'food',
        merchant: 'Grocery Store',
        description: 'Weekly groceries',
        date: new Date().toISOString()
      };
      
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTransaction)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.transaction).toBeDefined();
      expect(Number(response.body.data.transaction.amount)).toBe(newTransaction.amount);
      expect(response.body.data.transaction.category).toBe(newTransaction.category);
      
      // Verify in database
      const transactionInDb = await prisma.transaction.findFirst({
        where: { userId: userId }
      });
      expect(transactionInDb).toBeDefined();
      expect(Number(transactionInDb.amount)).toBe(newTransaction.amount);
    });
    
    test('should reject transaction without authentication', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          accountId: testAccount.id,
          type: 'debit',
          amount: 1000,
          category: 'food',
          date: new Date().toISOString()
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject transaction with missing required fields', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'debit',
          amount: 1000
          // Missing accountId, category, date
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/transactions', () => {
    
    beforeEach(async () => {
      // Create multiple test transactions
      await prisma.transaction.createMany({
        data: [
          {
            userId: userId,
            accountId: testAccount.id,
            type: 'debit',
            amount: 1000,
            category: 'food',
            date: new Date('2026-01-01')
          },
          {
            userId: userId,
            accountId: testAccount.id,
            type: 'credit',
            amount: 5000,
            category: 'salary',
            date: new Date('2026-01-01')
          },
          {
            userId: userId,
            accountId: testAccount.id,
            type: 'debit',
            amount: 500,
            category: 'transport',
            date: new Date('2026-01-02')
          }
        ]
      });
    });
    
    test('should get all user transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBe(3);
    });
    
    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/transactions?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data.transactions.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('GET /api/transactions/:id', () => {
    
    let transactionId;
    
    beforeEach(async () => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'debit',
          amount: 1000,
          category: 'food',
          date: new Date()
        }
      });
      transactionId = transaction.id;
    });
    
    test('should get transaction by ID', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction).toBeDefined();
      expect(response.body.data.transaction.id).toBe(transactionId);
    });
    
    test('should return 404 for non-existent transaction', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/transactions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('PUT /api/transactions/:id', () => {
    
    let transactionId;
    
    beforeEach(async () => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'debit',
          amount: 1000,
          category: 'food',
          date: new Date()
        }
      });
      transactionId = transaction.id;
    });
    
    test('should update transaction successfully', async () => {
      const updates = {
        accountId: testAccount.id,
        type: 'debit',
        amount: 1500,
        category: 'transport',
        description: 'Updated description',
        date: new Date().toISOString()
      };
      
      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.category).toBe(updates.category);
    });
  });
  
  describe('DELETE /api/transactions/:id', () => {
    
    let transactionId;
    
    beforeEach(async () => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          accountId: testAccount.id,
          type: 'debit',
          amount: 1000,
          category: 'food',
          date: new Date()
        }
      });
      transactionId = transaction.id;
    });
    
    test('should delete transaction successfully', async () => {
      const response = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify deleted from database
      const deletedTransaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });
      expect(deletedTransaction).toBeNull();
    });
  });
});
