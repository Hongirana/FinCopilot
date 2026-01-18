# FinCopilot Testing Documentation

**Last Updated:** January 18, 2026 (Day 28)  
**Test Framework:** Jest + Supertest  
**Total Tests:** 164  
**Success Rate:** 100%

---

## Table of Contents

1. [Overview](#overview)
2. [Test Setup](#test-setup)
3. [Running Tests](#running-tests)
4. [Test Suites](#test-suites)
5. [Test Results](#test-results)
6. [Writing Tests](#writing-tests)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

FinCopilot uses **Jest** for testing framework and **Supertest** for HTTP assertions. All backend API endpoints are tested with integration tests.

### Testing Strategy

- **Integration Tests:** Test complete API flows with database
- **Test Database:** Separate PostgreSQL database for testing
- **Test Isolation:** Each test suite starts with clean database
- **Authentication:** Test helper creates authenticated users
- **Real Database:** Tests use actual PostgreSQL (not mocks)

---

## Test Setup

### Prerequisites

1. **PostgreSQL** running on localhost
2. **Test database** created
3. **Environment** configured

### Create Test Database

```bash
# Create test database
createdb fincopilot_db_test

# Apply schema
cd backend
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fincopilot_db_test" npx prisma db push
```

### Environment Configuration

Create `backend/.env.test`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fincopilot_db_test?schema=public"
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing-only
```

### Install Dependencies

```bash
cd backend
npm install --save-dev jest supertest
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Authentication tests
npm test -- auth.test.js

# Transaction tests
npm test -- transaction.test.js

# Budget tests
npm test -- budgets.test.js

# Dashboard tests
npm test -- dashboard.test.js

# Goal tests
npm test -- goals.test.js

# User tests
npm test -- user.test.js

# Account tests
npm test -- account.test.js

# Analytics tests
npm test -- analyticsUtils.test.js

# Health check tests
npm test -- health.test.js
```

### Watch Mode (Auto-rerun on changes)

```bash
npm test -- --watch
```

### Test Coverage Report

```bash
npm run test:coverage
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## Test Suites

### 1. Authentication Tests (auth.test.js)

**File:** `tests/integration/auth.test.js`  
**Tests:** 15  
**Duration:** ~2.1s

**Coverage:**
- ✅ User signup with valid data
- ✅ Signup validation (email, password requirements)
- ✅ Duplicate email prevention
- ✅ User login with correct credentials
- ✅ Login with incorrect password
- ✅ Login with non-existent email
- ✅ JWT token generation
- ✅ Token verification
- ✅ Password hashing verification

**Key Test:**
```javascript
test('should create a new user with valid data', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'test@fincopilot.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User'
    })
    .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.data.user.email).toBe('test@fincopilot.com');
});
```

---

### 2. Transaction Tests (transaction.test.js)

**File:** `tests/integration/transaction.test.js`  
**Tests:** 9  
**Duration:** ~1.8s

**Coverage:**
- ✅ Create transaction with manual category
- ✅ Create transaction with AI auto-categorization
- ✅ List transactions with pagination
- ✅ Get single transaction by ID
- ✅ Update transaction
- ✅ Delete transaction
- ✅ Filter by category
- ✅ Budget auto-update on transaction create
- ✅ Authentication required

---

### 3. Budget Tests (budgets.test.js)

**File:** `tests/integration/budgets.test.js`  
**Tests:** 17  
**Duration:** ~3.6s

**Coverage:**
- ✅ Create budget
- ✅ List budgets with filters (category, period, active)
- ✅ Get budget by ID with status calculation
- ✅ Update budget
- ✅ Delete budget
- ✅ Budget alerts (threshold-based)
- ✅ Recalculate budgets
- ✅ Validation (category, period, dates)
- ✅ Overlapping budget prevention
- ✅ Budget spent calculation
- ✅ Percent spent calculation
- ✅ Days remaining calculation
- ✅ Over budget detection
- ✅ Authentication required

**Key Test:**
```javascript
test('should include budget utilization percentage', async () => {
  const response = await request(app)
    .get('/api/budgets')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  const foodBudget = response.body.data.budgets.find(b => b.category === 'food');
  expect(foodBudget.percentSpent).toBeDefined();
  expect(Number(foodBudget.percentSpent)).toBeCloseTo(53.33, 1);
});
```

---

### 4. Goal Tests (goals.test.js)

**File:** `tests/integration/goals.test.js`  
**Tests:** 24  
**Duration:** ~4.2s

**Coverage:**
- ✅ Create goal
- ✅ List goals with filters (status, category)
- ✅ Get goal by ID
- ✅ Update goal
- ✅ Delete goal
- ✅ Add progress/contribution
- ✅ Goal completion detection
- ✅ Goal statistics
- ✅ Progress percentage calculation
- ✅ Days remaining calculation
- ✅ Status transitions (active → completed)
- ✅ Validation (target amount, deadline)

---

### 5. Dashboard Tests (dashboard.test.js)

**File:** `tests/integration/dashboard.test.js`  
**Tests:** 12  
**Duration:** ~3.3s

**Coverage:**
- ✅ Dashboard summary (current month data)
- ✅ Previous month comparison
- ✅ Budget overview
- ✅ Goals overview
- ✅ Accounts summary
- ✅ Financial stats (net worth, cash flow)
- ✅ Savings metrics
- ✅ Quick overview
- ✅ Recent transactions
- ✅ Top expense categories
- ✅ Spending velocity
- ✅ Savings rate calculation

---

### 6. User Tests (user.test.js)

**File:** `tests/integration/user.test.js`  
**Tests:** 24  
**Duration:** ~3.9s

**Coverage:**
- ✅ Get user profile
- ✅ Update user profile
- ✅ Change password
- ✅ Get user statistics
- ✅ Profile validation
- ✅ Password validation (current/new)
- ✅ Email uniqueness
- ✅ Authentication required

---

### 7. Account Tests (account.test.js)

**File:** `tests/integration/account.test.js`  
**Tests:** 17  
**Duration:** ~2.3s

**Coverage:**
- ✅ Create account
- ✅ List accounts
- ✅ Get account by ID
- ✅ Update account
- ✅ Delete account
- ✅ Account types validation
- ✅ Balance validation
- ✅ User isolation (can only access own accounts)
- ✅ Total balance calculation

---

### 8. Analytics Tests (analyticsUtils.test.js)

**File:** `tests/unit/analyticsUtils.test.js`  
**Tests:** 35  
**Duration:** ~5.1s

**Coverage:**
- ✅ Monthly report generation
- ✅ Previous month comparison
- ✅ Spending by category
- ✅ Top categories calculation
- ✅ Date range filtering
- ✅ Percentage calculations
- ✅ Trend analysis

---

### 9. Health Check Tests (health.test.js)

**File:** `tests/integration/health.test.js`  
**Tests:** 11  
**Duration:** ~1.5s

**Coverage:**
- ✅ API health check
- ✅ Database connection check
- ✅ Redis connection check (if enabled)
- ✅ Environment verification
- ✅ Dependency checks

---

## Test Results (Day 28)

### Summary

```
Test Suites: 9 passed, 9 total
Tests:       164 passed, 164 total
Snapshots:   0 total
Time:        28.8s
```

### Detailed Results

| Test Suite | Tests | Status | Duration |
|------------|-------|--------|----------|
| auth.test.js | 15 | ✅ PASS | 2.1s |
| transaction.test.js | 9 | ✅ PASS | 1.8s |
| budgets.test.js | 17 | ✅ PASS | 3.6s |
| goals.test.js | 24 | ✅ PASS | 4.2s |
| dashboard.test.js | 12 | ✅ PASS | 3.3s |
| user.test.js | 24 | ✅ PASS | 3.9s |
| account.test.js | 17 | ✅ PASS | 2.3s |
| analyticsUtils.test.js | 35 | ✅ PASS | 5.1s |
| health.test.js | 11 | ✅ PASS | 1.5s |
| **TOTAL** | **164** | **✅ 100%** | **28.8s** |

### Success Rate: 100% 🎉

---

## Writing Tests

### Test Structure

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { prisma, cleanDatabase, connectDatabase, disconnectDatabase } = require('../helpers/testDb');
const { createTestUser } = require('../helpers/testData');

describe('Feature Name - Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser(prisma);
    userId = user.id;

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

  describe('POST /api/endpoint', () => {
    test('should do something successfully', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: 'value' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
```

### Test Helpers

**Location:** `tests/helpers/`

**testDb.js** - Database utilities:
```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.goal.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany()
  ]);
}

module.exports = { prisma, cleanDatabase, connectDatabase, disconnectDatabase };
```

**testData.js** - Test data generators:
```javascript
const bcrypt = require('bcryptjs');

async function createTestUser(prisma) {
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  return await prisma.user.create({
    data: {
      email: 'test@fincopilot.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      baseCurrency: 'INR'
    }
  });
}

module.exports = { createTestUser };
```

---

## Best Practices

### ✅ Do's

1. **Use beforeEach for clean slate**
   ```javascript
   beforeEach(async () => {
     await cleanDatabase();
   });
   ```

2. **Test both success and error cases**
   ```javascript
   test('should create successfully', ...);
   test('should return 400 for invalid data', ...);
   ```

3. **Use descriptive test names**
   ```javascript
   test('should return 404 when updating non-existent budget', ...);
   ```

4. **Verify database changes**
   ```javascript
   const budgetInDb = await prisma.budget.findFirst({
     where: { userId: userId }
   });
   expect(budgetInDb).toBeDefined();
   ```

5. **Test authentication**
   ```javascript
   test('should reject request without authentication', async () => {
     await request(app)
       .get('/api/budgets')
       .expect(401);
   });
   ```

### ❌ Don'ts

1. **Don't share state between tests** - Use beforeEach, not beforeAll for data setup
2. **Don't use hard-coded IDs** - Create data dynamically
3. **Don't skip cleanup** - Always clean database in beforeEach
4. **Don't test implementation** - Test behavior, not code structure
5. **Don't mock database in integration tests** - Use real database

---

## Troubleshooting

### Issue: Tests fail with "Connection refused"

**Solution:**
```bash
# Ensure PostgreSQL is running
pg_isready

# Check test database exists
psql -U postgres -l | grep fincopilot_db_test

# Recreate if needed
dropdb fincopilot_db_test
createdb fincopilot_db_test
DATABASE_URL="..." npx prisma db push
```

---

### Issue: "column does not exist" error

**Solution:** Schema out of sync
```bash
# Push latest schema to test DB
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fincopilot_db_test" npx prisma db push
```

---

### Issue: Tests hang and don't exit

**Solution:** Database connections not closed
```javascript
afterAll(async () => {
  await disconnectDatabase();
  await new Promise(resolve => setTimeout(resolve, 500));
});
```

---

### Issue: Intermittent test failures

**Causes:**
- Race conditions
- Shared state between tests
- Timing issues

**Solutions:**
- Use `await` for all async operations
- Clean database in `beforeEach`
- Add small delays if needed: `await new Promise(r => setTimeout(r, 100))`

---

### Issue: Slow test execution

**Optimization:**
```javascript
// Use transactions for faster cleanup
beforeEach(async () => {
  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.user.deleteMany()
  ]);
});
```

---

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm install

      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fincopilot_db_test
        run: |
          cd backend
          createdb fincopilot_db_test
          npx prisma db push

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fincopilot_db_test
          JWT_SECRET: test-secret-key
        run: |
          cd backend
          npm test
```

---

## Test Coverage Goals

**Current Coverage:** 100% of API endpoints  
**Future Goals:**
- Unit tests for utility functions
- Frontend component tests (React Testing Library)
- E2E tests (Playwright)
- Performance tests
- Security tests

---

## Next Steps

1. **Frontend Testing** - Add React component tests
2. **E2E Testing** - Implement Playwright tests
3. **Load Testing** - Test API under high load
4. **Security Testing** - Penetration testing

---

**Happy Testing! 🧪✅**

**Last Updated:** January 18, 2026  
**Maintained by:** Kiran, MERN Stack Developer
