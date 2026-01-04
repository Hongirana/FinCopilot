const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Sample test users
 */
const testUser = {
  email: 'test@fincopilot.com',
  password: 'Test123!@#',
  name: 'Test User'
};

const testUser2 = {
  email: 'test2@fincopilot.com',
  password: 'Test456!@#',
  name: 'Test User 2'
};

/**
 * Sample test transactions
 */
const testTransaction = {
  type: 'expense',
  amount: 1000.50,
  description: 'Test grocery shopping',
  category: 'Food & Dining',
  date: new Date('2026-01-01T10:00:00Z')
};

const testTransaction2 = {
  type: 'income',
  amount: 5000,
  description: 'Test salary',
  category: 'Salary',
  date: new Date('2026-01-01T10:00:00Z')
};

/**
 * Sample test budgets
 */
const testBudget = {
  category: 'Food & Dining',
  limit: 5000,
  spent: 0,
  period: 'monthly',
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: new Date('2026-01-31T23:59:59Z')
};

const testBudget2 = {
  category: 'Transportation',
  limit: 3000,
  spent: 0,
  period: 'monthly',
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: new Date('2026-01-31T23:59:59Z')
};

/**
 * Sample test goals
 */
const testGoal = {
  name: 'Emergency Fund',
  targetAmount: 100000,
  currentAmount: 0,
  deadline: new Date('2026-12-31T23:59:59Z'),
  status: 'active'
};

const testGoal2 = {
  name: 'Vacation Fund',
  targetAmount: 50000,
  currentAmount: 10000,
  deadline: new Date('2026-06-30T23:59:59Z'),
  status: 'active'
};

/**
 * Sample test accounts
 */
const testAccount = {
  name: 'Test Savings Account',
  type: 'savings',
  balance: 50000,
  currency: 'INR'
};

const testAccount2 = {
  name: 'Test Checking Account',
  type: 'checking',
  balance: 25000,
  currency: 'INR'
};

/**
 * Create test user in database
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} userData - User data (optional)
 * @returns {Promise<Object>} Created user
 */
async function createTestUser(prisma, userData = testUser) {
  // Bcrypt 6.x syntax (same as 5.x)
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  return await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name
    }
  });
}

/**
 * Generate JWT token for testing
 * @param {number} userId - User ID
 * @returns {string} JWT token
 */
function generateTestToken(userId) {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'test-secret-key-fincopilot',
    { expiresIn: '1h' }
  );
}

/**
 * Create test account
 * @param {PrismaClient} prisma
 * @param {number} userId
 * @param {Object} accountData
 * @returns {Promise<Object>}
 */
async function createTestAccount(prisma, userId, accountData = testAccount) {
  return await prisma.account.create({
    data: {
      ...accountData,
      userId
    }
  });
}

/**
 * Create test transaction
 * @param {PrismaClient} prisma
 * @param {number} userId
 * @param {number} accountId
 * @param {Object} transactionData
 * @returns {Promise<Object>}
 */
async function createTestTransaction(prisma, userId, accountId, transactionData = testTransaction) {
  return await prisma.transaction.create({
    data: {
      ...transactionData,
      userId,
      accountId
    }
  });
}

/**
 * Create test budget
 * @param {PrismaClient} prisma
 * @param {number} userId
 * @param {Object} budgetData
 * @returns {Promise<Object>}
 */
async function createTestBudget(prisma, userId, budgetData = testBudget) {
  return await prisma.budget.create({
    data: {
      ...budgetData,
      userId
    }
  });
}

/**
 * Create test goal
 * @param {PrismaClient} prisma
 * @param {number} userId
 * @param {Object} goalData
 * @returns {Promise<Object>}
 */
async function createTestGoal(prisma, userId, goalData = testGoal) {
  return await prisma.goal.create({
    data: {
      ...goalData,
      userId
    }
  });
}

module.exports = {
  // Test data
  testUser,
  testUser2,
  testTransaction,
  testTransaction2,
  testBudget,
  testBudget2,
  testGoal,
  testGoal2,
  testAccount,
  testAccount2,
  
  // Helper functions
  createTestUser,
  generateTestToken,
  createTestAccount,
  createTestTransaction,
  createTestBudget,
  createTestGoal
};
