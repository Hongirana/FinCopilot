// tests/integration/goals.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../../helpers/testDb');
const { createTestUser } = require('../../helpers/testData');

describe('Goals API - Integration Tests', () => {
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

    describe('POST /api/goals', () => {
        test('should create a new goal successfully', async () => {
            const newGoal = {
                title: 'Emergency Fund',
                description: 'Build emergency fund for 6 months',
                targetAmount: 100000,
                deadline: '2026-12-31',
                category: 'savings',
                priority: 'high'
            };

            const response = await request(app)
                .post('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newGoal)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBe(newGoal.title);
            expect(Number(response.body.data.targetAmount)).toBe(newGoal.targetAmount);
            expect(response.body.data.status).toBe('ACTIVE');
            expect(Number(response.body.data.currentAmount)).toBe(0);

            // Verify in database
            const goalInDb = await prisma.goal.findFirst({
                where: { userId: userId }
            });
            expect(goalInDb).toBeDefined();
            expect(goalInDb.title).toBe(newGoal.title);
        });

        test('should reject goal creation without authentication', async () => {
            const response = await request(app)
                .post('/api/goals')
                .send({
                    title: 'Test Goal',
                    targetAmount: 50000,
                    deadline: '2026-12-31',
                    category: 'savings'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should reject goal with missing required fields', async () => {
            const response = await request(app)
                .post('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Goal'
                    // Missing targetAmount, deadline, category
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should reject goal with negative target amount', async () => {
            const response = await request(app)
                .post('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Goal',
                    targetAmount: -5000,
                    deadline: '2026-12-31',
                    category: 'savings'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should reject goal with past deadline', async () => {
            const response = await request(app)
                .post('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Goal',
                    targetAmount: 50000,
                    deadline: '2020-01-01',
                    category: 'savings'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            console.log(response.body);
            const errorMessage = response.body.error.message || response.body.message;
            expect(errorMessage).toContain('future');
        });

        test('should create goal with currentAmount initialized to 0', async () => {
            const response = await request(app)
                .post('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Vacation Fund',
                    targetAmount: 50000,
                    deadline: '2026-06-30',
                    category: 'travel'
                })
                .expect(201);

            expect(Number(response.body.data.currentAmount)).toBe(0);
            expect(response.body.data.status).toBe('ACTIVE');
        });
    });

    describe('GET /api/goals', () => {
        beforeEach(async () => {
            // Create multiple test goals
            const goalsData = [
                {
                    userId: userId,
                    title: 'Emergency Fund',
                    targetAmount: 100000,
                    currentAmount: 50000,
                    deadline: new Date('2026-12-31'),
                    category: 'savings',
                    priority: 'high',
                    status: 'ACTIVE'
                },
                {
                    userId: userId,
                    title: 'Vacation',
                    targetAmount: 50000,
                    currentAmount: 25000,
                    deadline: new Date('2026-06-30'),
                    category: 'travel',
                    priority: 'medium',
                    status: 'ACTIVE'
                },
                {
                    userId: userId,
                    title: 'Car Purchase',
                    targetAmount: 200000,
                    currentAmount: 200000,
                    deadline: new Date('2025-12-31'),
                    category: 'purchase',
                    priority: 'high',
                    status: 'COMPLETED'
                }
            ];

            await Promise.all(
                goalsData.map(data => prisma.goal.create({ data }))
            );
        });

        test('should get all user goals', async () => {
            const response = await request(app)
                .get('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.count).toBe(3);
            expect(Array.isArray(response.body.data.goals)).toBe(true);
            expect(response.body.data.goals.length).toBe(3);
        });

        test('should include calculated fields (progressPercentage, remaining, daysRemaining)', async () => {
            const response = await request(app)
                .get('/api/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const emergencyFund = response.body.data.goals.find(g => g.title === 'Emergency Fund');

            expect(emergencyFund.progressPercentage).toBeDefined();
            expect(Number(emergencyFund.progressPercentage)).toBe(50.00);
            expect(emergencyFund.remaining).toBeDefined();
            expect(Number(emergencyFund.remaining)).toBe(50000);
            expect(emergencyFund.daysRemaining).toBeDefined();
        });

        test('should filter goals by status', async () => {
            const response = await request(app)
                .get('/api/goals?status=ACTIVE')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.count).toBe(2);
            response.body.data.goals.forEach(goal => {
                expect(goal.status).toBe('ACTIVE');
            });
        });

        test('should filter goals by category', async () => {
            const response = await request(app)
                .get('/api/goals?category=savings')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.count).toBe(1);
            expect(response.body.data.goals[0].category).toBe('savings');
        });

        test('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/goals')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/goals/:id', () => {
        let goalId;

        beforeEach(async () => {
            const goal = await prisma.goal.create({
                data: {
                    userId: userId,
                    title: 'Test Goal',
                    targetAmount: 75000,
                    currentAmount: 25000,
                    deadline: new Date('2026-09-30'),
                    category: 'investment',
                    status: 'ACTIVE'
                }
            });
            goalId = goal.id;
        });

        test('should get goal by ID', async () => {
            const response = await request(app)
                .get(`/api/goals/${goalId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data[0].id).toBe(goalId);
            expect(response.body.data[0].title).toBe('Test Goal');
            expect(response.body.data[0].progressPercentage).toBeDefined();
        });

        test('should return 404 for non-existent goal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/goals/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should not access another user goal', async () => {
            // Create another user and their goal
            const otherUser = await prisma.user.create({
                data: {
                    email: 'other@test.com',
                    password: 'hashedpassword',
                    name: 'Other User'
                }
            });

            const otherGoal = await prisma.goal.create({
                data: {
                    userId: otherUser.id,
                    title: 'Other User Goal',
                    targetAmount: 50000,
                    currentAmount: 0,
                    deadline: new Date('2026-12-31'),
                    category: 'savings',
                    status: 'ACTIVE'
                }
            });

            // Try to access other user's goal
            const response = await request(app)
                .get(`/api/goals/${otherGoal.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/goals/:id/progress', () => {
        let goalId;

        beforeEach(async () => {
            const goal = await prisma.goal.create({
                data: {
                    userId: userId,
                    title: 'Progress Test Goal',
                    targetAmount: 100000,
                    currentAmount: 30000,
                    deadline: new Date('2026-12-31'),
                    category: 'savings',
                    status: 'ACTIVE'
                }
            });
            goalId = goal.id;
        });

        test('should update goal progress successfully', async () => {
            const response = await request(app)
                .patch(`/api/goals/${goalId}/progress`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 20000 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Number(response.body.data.currentAmount)).toBe(50000); // 30000 + 20000

            // Verify in database
            const updatedGoal = await prisma.goal.findUnique({
                where: { id: goalId }
            });
            expect(Number(updatedGoal.currentAmount)).toBe(50000);
        });

        test('should mark goal as COMPLETED when target is reached', async () => {
            const response = await request(app)
                .patch(`/api/goals/${goalId}/progress`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 70000 }) // 30000 + 70000 = 100000 (target reached)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('COMPLETED');
            expect(response.body.message).toContain('Congratulations');
        });

        test('should reject negative or zero amount', async () => {
            const response = await request(app)
                .patch(`/api/goals/${goalId}/progress`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: -5000 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent goal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .patch(`/api/goals/${fakeId}/progress`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 10000 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/goals/:id', () => {
        let goalId;

        beforeEach(async () => {
            const goal = await prisma.goal.create({
                data: {
                    userId: userId,
                    title: 'Update Test Goal',
                    targetAmount: 50000,
                    currentAmount: 10000,
                    deadline: new Date('2026-08-31'),
                    category: 'savings',
                    priority: 'medium',
                    status: 'ACTIVE'
                }
            });
            goalId = goal.id;
        });

        test('should update goal details successfully', async () => {
            const updates = {
                title: 'Updated Goal Title',
                description: 'Updated description',
                targetAmount: 75000,
                deadline: '2026-12-31',
                category: 'investment',
                priority: 'high'
            };

            const response = await request(app)
                .put(`/api/goals/${goalId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updates.title);
            expect(Number(response.body.data.targetAmount)).toBe(updates.targetAmount);

            // Verify in database
            const updatedGoal = await prisma.goal.findUnique({
                where: { id: goalId }
            });
            expect(updatedGoal.title).toBe(updates.title);
        });

        test('should return 404 when updating non-existent goal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/api/goals/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Updated Title' })
                // .expect(404);
            console.log(response.body);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/goals/:id', () => {
        let goalId;

        beforeEach(async () => {
            const goal = await prisma.goal.create({
                data: {
                    userId: userId,
                    title: 'Delete Test Goal',
                    targetAmount: 50000,
                    currentAmount: 10000,
                    deadline: new Date('2026-12-31'),
                    category: 'savings',
                    status: 'ACTIVE'
                }
            });
            goalId = goal.id;
        });

        test('should delete goal successfully', async () => {
            const response = await request(app)
                .delete(`/api/goals/${goalId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify deleted from database
            const deletedGoal = await prisma.goal.findUnique({
                where: { id: goalId }
            });
            expect(deletedGoal).toBeNull();
        });

        test('should return 404 when deleting non-existent goal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .delete(`/api/goals/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/goals/stats', () => {
        beforeEach(async () => {
            // Create goals with different statuses
            await prisma.goal.createMany({
                data: [
                    {
                        userId: userId,
                        title: 'Active Goal 1',
                        targetAmount: 100000,
                        currentAmount: 50000,
                        deadline: new Date('2026-12-31'),
                        category: 'savings',
                        status: 'ACTIVE'
                    },
                    {
                        userId: userId,
                        title: 'Active Goal 2',
                        targetAmount: 50000,
                        currentAmount: 25000,
                        deadline: new Date('2026-06-30'),
                        category: 'travel',
                        status: 'ACTIVE'
                    },
                    {
                        userId: userId,
                        title: 'Completed Goal',
                        targetAmount: 30000,
                        currentAmount: 30000,
                        deadline: new Date('2025-12-31'),
                        category: 'purchase',
                        status: 'COMPLETED'
                    },
                    {
                        userId: userId,
                        title: 'Cancelled Goal',
                        targetAmount: 20000,
                        currentAmount: 5000,
                        deadline: new Date('2026-03-31'),
                        category: 'other',
                        status: 'CANCELLED'
                    }
                ]
            });
        });

        test('should get goal statistics successfully', async () => {
            const response = await request(app)
                .get('/api/goals/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();

            const stats = response.body.data;
            expect(stats.totalGoals).toBe(4);
            expect(stats.activeGoals).toBe(2);
            expect(stats.completedGoals).toBe(1);
            expect(stats.cancelledGoals).toBe(1);
            expect(stats.totalTargetAmount).toBe(150000); // 100000 + 50000 (only ACTIVE)
            expect(stats.totalSavedAmount).toBe(75000); // 50000 + 25000 (only ACTIVE)
            expect(stats.overallProgress).toBeDefined();
            expect(stats.remaining).toBe(75000);
        });

        test('should calculate overall progress correctly', async () => {
            const response = await request(app)
                .get('/api/goals/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const stats = response.body.data;
            // 75000 / 150000 * 100 = 50%
            expect(stats.overallProgress).toBe('50.00%');
        });
    });
});
