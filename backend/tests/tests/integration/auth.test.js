const request = require('supertest');
const app = require('../../../src/app'); // ✅ CORRECTED PATH
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');

describe('Authentication API - Integration Tests', () => {
  
  beforeAll(async () => {
    await connectDatabase();
  });
  
  beforeEach(async () => {
    await cleanDatabase();
  });
  
  afterAll(async () => {
    await disconnectDatabase();
  });
  
  describe('POST /api/auth/signUp', () => {
    
    test('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@fincopilot.com',
        password: 'Test123!@#',
        name: 'Test User'
      };
      
      const response = await request(app)
        .post('/api/auth/signUp')
        .send(newUser)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.password).toBeUndefined();
      
      // Verify user in database
      const userInDb = await prisma.user.findUnique({
        where: { email: newUser.email }
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(newUser.email);
    });
    
    test('should reject duplicate email registration', async () => {
      const newUser = {
        email: 'test@fincopilot.com',
        password: 'Test123!@#',
        name: 'Test User'
      };
      
      // First registration
      await request(app)
        .post('/api/auth/signUp')
        .send(newUser)
        .expect(201);
      
      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/signUp')
        .send(newUser)
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    test('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          password: 'Test123!@#',
          name: 'Test User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'test@fincopilot.com',
          password: '123',
          name: 'Test User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Test User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/login', () => {
    
    const testUser = {
      email: 'test@fincopilot.com',
      password: 'Test123!@#',
      name: 'Test User'
    };
    
    beforeEach(async () => {
      // Create user for login tests
      await request(app)
        .post('/api/auth/signUp')
        .send(testUser);
    });
    
    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      
      // Verify token format (JWT)
      const token = response.body.data.token;
      expect(token.split('.').length).toBe(3);
    });
    
    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Protected Routes - Token Validation', () => {
    
    let authToken;
    let userId;
    
    beforeEach(async () => {
      // Register and login to get token
      const signupResponse = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'test@fincopilot.com',
          password: 'Test123!@#',
          name: 'Test User'
        });
      
      authToken = signupResponse.body.data.token;
      userId = signupResponse.body.data.user.id;
    });
    
    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/users/me/profile')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/users/me/profile')
        .set('Authorization', authToken) // Missing "Bearer " prefix
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
});
