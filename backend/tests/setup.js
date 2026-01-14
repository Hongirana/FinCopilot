// Load test environment variables FIRST
require('dotenv').config({ path: '.env.test' });

const { cleanDatabase, disconnectDatabase, connectDatabase, checkDatabaseConnection } = require('./helpers/testDb');

// Global setup - runs once before all test suites
beforeAll(async () => {
  console.log('\n🚀 Starting FinCopilot Test Suite');
  console.log('=' .repeat(50));
  console.log('📦 Jest version:', require('jest/package.json').version);
  console.log('🧪 Supertest version:', require('supertest/package.json').version);
  console.log('⚡ Express version:', require('express/package.json').version);
  console.log('🗄️  Prisma version:', require('@prisma/client/package.json').version);
  console.log('🔧 Node environment:', process.env.NODE_ENV);
  console.log('=' .repeat(50));
  
  // Connect to database
  await connectDatabase();
  
  // Verify connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to test database');
  }
  
  // Initial cleanup
  await cleanDatabase();
});

// Cleanup after each test - ensures test isolation
afterEach(async () => {
  await cleanDatabase();
});

// Global cleanup - runs once after all test suites
afterAll(async () => {
  await disconnectDatabase();
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test suite completed!');
  console.log('='.repeat(50) + '\n');
});

// Set timeout for database operations
jest.setTimeout(100000);

// Suppress unnecessary console output during tests (optional)
// Uncomment if you want cleaner test output
/*
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};
*/
