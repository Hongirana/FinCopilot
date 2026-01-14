const request = require('supertest');
const app = require('../../../src/app');
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser ,generateTestToken} = require('../../helpers/testData');
const bcrypt = require('bcrypt');

describe('User API - Integration Tests', () => {
    let authToken;
    let userId;
    let testPassword = 'TestPass123!';

    beforeAll(async () => {
        await connectDatabase();
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();
        const user = await createTestUser(prisma);
        console.log(user);
        authToken = user.token || await generateTestToken(user.id);
        userId = user.id;
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    // ==================== GET /api/users ====================
    describe('GET /api/users', () => {
        test('should get all users successfully', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Users Fetched Successfully');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0]).toHaveProperty('id');
            expect(response.body.data[0]).toHaveProperty('email');
            expect(response.body.data[0]).toHaveProperty('firstName');
            expect(response.body.data[0]).toHaveProperty('lastName');
            expect(response.body.data[0]).not.toHaveProperty('password');
        });

        test('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== POST /api/users ====================
    describe('POST /api/users', () => {
        test('should create a new user successfully', async () => {
            const newUser = {
                email: 'newuser@example.com',
                firstName: 'New',
                lastName: 'User',
                password: 'SecurePass123!'
            };

            const response = await request(app)
                .post('/api/users')
                .send(newUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.email).toBe(newUser.email);
            expect(response.body.data.firstName).toBe(newUser.firstName);
            expect(response.body.data.lastName).toBe(newUser.lastName);
            expect(response.body.data).not.toHaveProperty('password');
        });

        test('should reject duplicate email registration', async () => {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            const duplicateUser = {
                email: existingUser.email,
                firstName: 'Duplicate',
                lastName: 'User',
                password: 'TestPass123!'
            };

            const response = await request(app)
                .post('/api/users')
                .send(duplicateUser)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('already registered');
        });
    });

    // ==================== GET /api/users/:id ====================
    describe('GET /api/users/:id', () => {
        test('should get user by ID successfully', async () => {
            const response = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User Fetched Successfully');
            expect(response.body.data.id).toBe(userId);
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data).toHaveProperty('firstName');
            expect(response.body.data).toHaveProperty('lastName');
            expect(response.body.data).not.toHaveProperty('password');
        });

        test('should return 404 for non-existent user', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('not found');
        });

        test('should reject request without authentication', async () => {
            const response = await request(app)
                .get(`/api/users/${userId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== GET /api/users/me/profile ====================
    describe('GET /api/users/me/profile', () => {
        test('should get current user profile successfully', async () => {
            const response = await request(app)
                .get('/api/users/me/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Profile retrieved successfully');
            expect(response.body.data.id).toBe(userId);
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data).toHaveProperty('firstName');
            expect(response.body.data).toHaveProperty('lastName');
            expect(response.body.data).toHaveProperty('createdAt');
            expect(response.body.data).toHaveProperty('updatedAt');
            expect(response.body.data).not.toHaveProperty('password');
        });

        test('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/users/me/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== GET /api/users/me/stats ====================
    describe('GET /api/users/me/stats', () => {
        test('should get user statistics successfully', async () => {
            // Create some test data
          const account =  await prisma.account.create({
                data: {
                    userId: userId,
                    name: 'Test Account',
                    type: 'savings',
                    balance: 10000
                }
            });

            await prisma.transaction.create({
                data: {
                    userId: userId,
                    amount: 500,
                    accountId: account.id,
                    type: 'credit',
                    category: 'salary',
                    description: 'Test transaction',
                    date: new Date()
                }
            });

            const response = await request(app)
                .get('/api/users/me/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User statistics retrieved successfully');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data.stats).toHaveProperty('transactions');
            expect(response.body.data.stats).toHaveProperty('budgets');
            expect(response.body.data.stats).toHaveProperty('goals');
            expect(response.body.data.stats).toHaveProperty('accounts');
            expect(response.body.data.stats.transactions).toBe(1);
            expect(response.body.data.stats.accounts).toBe(1);
        });

        test('should return zero counts for new user', async () => {
            const response = await request(app)
                .get('/api/users/me/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.stats.transactions).toBe(0);
            expect(response.body.data.stats.budgets).toBe(0);
            expect(response.body.data.stats.goals).toBe(0);
            expect(response.body.data.stats.accounts).toBe(0);
        });
    });

    // ==================== PUT /api/users/me ====================
    describe('PUT /api/users/me', () => {
        test('should update profile successfully', async () => {
            const updates = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            const response = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Profile updated successfully');
            expect(response.body.data.firstName).toBe(updates.firstName);
            expect(response.body.data.lastName).toBe(updates.lastName);
            expect(response.body.data).toHaveProperty('updatedAt');
        });

        test('should update email successfully', async () => {
            const updates = {
                email: 'newemail@example.com'
            };

            const response = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(updates.email);
        });

        test('should reject duplicate email', async () => {
            // Create another user
            const anotherUser = await prisma.user.create({
                data: {
                    email: 'another@example.com',
                    firstName: 'Another',
                    lastName: 'User',
                    password: await bcrypt.hash('password123', 10)
                }
            });

            const updates = {
                email: anotherUser.email
            };

            const response = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('already in use');
        });

        test('should allow partial updates', async () => {
            const updates = {
                firstName: 'OnlyFirstName'
            };

            const response = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe(updates.firstName);
        });
    });

    // ==================== PUT /api/users/me/password ====================
    describe('PUT /api/users/me/password', () => {
        test('should change password successfully', async () => {
            // First, get the user and set a known password
            const passwordHash = await bcrypt.hash(testPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { password: passwordHash }
            });

            const passwordData = {
                currentPassword: testPassword,
                newPassword: 'NewSecurePass456!'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password updated successfully');

            // Verify the password was actually changed
            const updatedUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            const isNewPasswordValid = await bcrypt.compare(passwordData.newPassword, updatedUser.password);
            expect(isNewPasswordValid).toBe(true);
        });

        test('should reject incorrect current password', async () => {
            const passwordData = {
                currentPassword: 'WrongPassword123!',
                newPassword: 'NewSecurePass456!'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('incorrect');
        });

        test('should reject short new password', async () => {
            const passwordHash = await bcrypt.hash(testPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { password: passwordHash }
            });

            const passwordData = {
                currentPassword: testPassword,
                newPassword: 'short'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('8 characters');
        });

        test('should reject missing current password', async () => {
            const passwordData = {
                newPassword: 'NewSecurePass456!'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('required');
        });

        test('should reject missing new password', async () => {
            const passwordData = {
                currentPassword: testPassword
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('required');
        });
    });

    // ==================== DELETE /api/users/me ====================
    describe('DELETE /api/users/me', () => {
        test('should delete account successfully with correct password', async () => {
            // Set a known password
            const passwordHash = await bcrypt.hash(testPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { password: passwordHash }
            });

            const response = await request(app)
                .delete('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: testPassword })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Account deleted successfully');

            // Verify user is actually deleted
            const deletedUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            expect(deletedUser).toBeNull();
        });

        test('should reject deletion with incorrect password', async () => {
            const response = await request(app)
                .delete('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: 'WrongPassword123!' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('Invalid password');
        });

        test('should reject deletion without password', async () => {
            const response = await request(app)
                .delete('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('Password confirmation required');
        });

        test('should reject request without authentication', async () => {
            const response = await request(app)
                .delete('/api/users/me')
                .send({ password: testPassword })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
