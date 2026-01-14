const request = require('supertest');
const app = require('../../../src/app'); // ✅ CORRECTED PATH
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser } = require('../../helpers/testData');

describe('Accounts API - Integration Tests', () => {

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
    console.log('Login Response :', loginResponse.body);
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/accounts/', () => {

    test('should create a new account successfully', async () => {
      const newAccount = {
        name: 'Savings Account',
        type: 'savings',
        balance: 10000,
        bankName: 'HDFC Bank',
        currency: 'INR'
      };
      console.log('newAccount :', newAccount);
      console.log('authToken :', authToken);
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAccount)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.account.name).toBe(newAccount.name);
      expect(response.body.data.account.type).toBe(newAccount.type);
      expect(Number(response.body.data.account.balance)).toBe(newAccount.balance);

      // Verify in database
      const accountInDb = await prisma.account.findFirst({
        where: { userId: userId }
      });
      expect(accountInDb).toBeDefined();
      expect(accountInDb.name).toBe(newAccount.name);
    });

    test('should reject account creation without authentication', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'Test Account',
          type: 'savings',
          balance: 5000
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject account with missing required fields', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account'
          // Missing type and balance
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject account with invalid type', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account',
          type: 'invalid_type',
          balance: 5000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject account with negative balance', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account',
          type: 'savings',
          balance: -1000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should create account with default currency', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account',
          type: 'checking',
          balance: 5000
        })
        .expect(201);

      expect(response.body.data.account.currency).toBe('INR');
    });
  });

  describe('GET /api/accounts', () => {

    beforeEach(async () => {
      // Create multiple test accounts
      await prisma.account.createMany({
        data: [
          {
            userId: userId,
            name: 'Savings Account',
            type: 'savings',
            balance: 50000,
            currency: 'INR'
          },
          {
            userId: userId,
            name: 'Checking Account',
            type: 'checking',
            balance: 25000,
            currency: 'INR'
          },
          {
            userId: userId,
            name: 'Credit Card',
            type: 'credit_card',
            balance: -5000,
            currency: 'INR'
          }
        ]
      });
    });

    test('should get all user accounts', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.accounts)).toBe(true);
      expect(response.body.data.accounts.length).toBe(3);
    });

    test('should calculate total balance', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
      console.log('response.body.data.totalBalance :', response.body);
      // Total: 50000 + 25000 - 5000 = 70000
      expect(response.body.data.totalBalance).toBeDefined();
      expect(Number(response.body.data.totalBalance)).toBe(70000);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/accounts/:id', () => {

    let accountId;

    beforeEach(async () => {
      const account = await prisma.account.create({
        data: {
          userId: userId,
          name: 'Test Account',
          type: 'savings',
          balance: 10000,
          currency: 'INR'
        }
      });
      accountId = account.id;
    });

    test('should get account by ID', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.account.id).toBe(accountId);
      expect(response.body.data.account.name).toBe('Test Account');
    });

    test('should return 404 for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should not access another user account', async () => {
      // Create another user and their account
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password: 'hashedpassword',
          name: 'Other User'
        }
      });

      const otherAccount = await prisma.account.create({
        data: {
          userId: otherUser.id,
          name: 'Other Account',
          type: 'savings',
          balance: 5000,
          currency: 'INR'
        }
      });

      // Try to access other user's account
      const response = await request(app)
        .get(`/api/accounts/${otherAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/accounts/:id', () => {

    let accountId;

    beforeEach(async () => {
      const account = await prisma.account.create({
        data: {
          userId: userId,
          name: 'Test Account',
          type: 'savings',
          balance: 10000,
          currency: 'INR'
        }
      });
      accountId = account.id;
    });

    test('should update account successfully', async () => {
      const updates = {
        name: 'Updated Account Name',
        type: 'checking',
        balance: 15000,
        bankName: 'ICICI Bank'
      };

      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.account.name).toBe(updates.name);
      expect(response.body.data.account.bankName).toBe(updates.bankName);

      // Verify in database
      const updatedAccount = await prisma.account.findUnique({
        where: { id: accountId }
      });
      expect(updatedAccount.name).toBe(updates.name);
    });

    test('should return 404 when updating non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .put(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          type: 'savings',      // ✅ ADD
          balance: 10000
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/accounts/:id', () => {

    let accountId;

    beforeEach(async () => {
      const account = await prisma.account.create({
        data: {
          userId: userId,
          name: 'Test Account',
          type: 'savings',
          balance: 10000,
          currency: 'INR'
        }
      });
      accountId = account.id;
    });

    test('should delete account successfully', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted from database
      const deletedAccount = await prisma.account.findUnique({
        where: { id: accountId }
      });
      expect(deletedAccount).toBeNull();
    });

    test('should return 404 when deleting non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should cascade delete related transactions', async () => {
      // Create a transaction for this account
      await prisma.transaction.create({
        data: {
          userId: userId,
          accountId: accountId,
          type: 'debit',
          amount: 1000,
          category: 'food',
          date: new Date()
        }
      });

      // Delete account
      await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify transactions are also deleted (cascade)
      const transactions = await prisma.transaction.findMany({
        where: { accountId: accountId }
      });
      expect(transactions.length).toBe(0);
    });
  });
});
