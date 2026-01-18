const request = require('supertest');
const app = require('../../../src/app');
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
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/signUp')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.firstName).toBe(newUser.firstName);
      expect(response.body.data.user.lastName).toBe(newUser.lastName);
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned

      // Verify user in database
      const userInDb = await prisma.user.findUnique({
        where: { email: newUser.email }
      });

      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(newUser.email);
      expect(userInDb.firstName).toBe(newUser.firstName);
    });

    test('should reject duplicate email registration', async () => {
      const newUser = {
        email: 'test@fincopilot.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
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
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'test@fincopilot.com',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject registration with missing firstName', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'test@fincopilot.com',
          password: 'Test123!@#',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject registration with missing lastName', async () => {
      const response = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'test@fincopilot.com',
          password: 'Test123!@#',
          firstName: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'test@fincopilot.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User'
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
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.token).toBeDefined();

      // Verify token format (JWT has 3 parts separated by dots)
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
        .expect(400);

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
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
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
      // Register user
      const signupResponse = await request(app)
        .post('/api/auth/signUp')
        .send({
          email: 'test@fincopilot.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User'
        });

      userId = signupResponse.body.data.user.id;

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@fincopilot.com',
          password: 'Test123!@#'
        });

      authToken = loginResponse.body.data.token;
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
