require('dotenv').config({ path: '.env.test' });

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../src/generated/prisma');

console.log('🔍 Loading testDb.js...');
console.log('🔍 Test DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌');

// Create pool (same as your prismaClient.js)
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Create adapter (same as your prismaClient.js)
const adapter = new PrismaPg(pool);

// Create base Prisma client (same as your prismaClient.js)
const basePrisma = new PrismaClient({ adapter });

// For testing, we DON'T need userMiddleware extension
// Keep it simple for tests
const prisma = basePrisma;

// Pool event handlers for debugging
pool.on('connect', () => {
  console.log('✅ Test database pool connected');
});

pool.on('error', (err) => {
  console.log('❌ Pool error:', err.message);
});

/**
 * Clean all tables in test database
 */
async function cleanDatabase() {
  try {
    // Delete in correct order (respecting foreign keys)
    await prisma.transaction.deleteMany({});
    await prisma.budget.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.log('❌ Error cleaning database:', error.message);
    console.log('Full error:', error);
    throw error;
  }
}

/**
 * Connect to test database
 */
async function connectDatabase() {
  try {
    console.log('🔌 Connecting to test database...');
    await prisma.$connect();
    console.log('✅ Prisma connected to test database');
  } catch (error) {
    console.log('❌ Error connecting to database:');
    console.log('   Message:', error.message);
    console.log('   Code:', error.code);
    throw error;
  }
}

/**
 * Disconnect from test database - PROPERLY CLOSE EVERYTHING
 */
async function disconnectDatabase() {
  try {
    console.log('🔌 Disconnecting from test database...');
    
    // Disconnect Prisma first
    if (prisma) {
      await prisma.$disconnect();
      console.log('✅ Prisma disconnected');
    }
    
    // Then close the pool
    if (pool) {
      await pool.end();
      console.log('✅ Pool closed');
    }
    
    console.log('✅ Test database fully disconnected');
  } catch (error) {
    console.log('❌ Error disconnecting database:', error.message);
    // Force cleanup even if error
    try {
      if (pool) await pool.end();
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Reset database
 */
async function resetDatabase() {
  await cleanDatabase();
  console.log('✅ Database reset complete');
}

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection check passed:', result);
    return true;
  } catch (error) {
    console.log('❌ Database connection check failed:');
    console.log('   Message:', error.message);
    console.log('   Code:', error.code);
    return false;
  }
}

module.exports = {
  prisma,
  pool,
  cleanDatabase,
  connectDatabase,
  disconnectDatabase,
  resetDatabase,
  checkDatabaseConnection
};
