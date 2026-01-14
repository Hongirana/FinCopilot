module.exports = {
  // Test environment - Node.js
  testEnvironment: 'node',
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/index.js',
    '!src/app.js'
  ],
  
  // Where Jest looks for test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Folders to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/prisma/'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup file runs before all tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout (30 seconds for database operations)
  testTimeout: 30000,
  
  // Detailed output
  verbose: true,
  
  // Jest 30 specific features
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true,
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Module paths (helps Jest find your src files)
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform (no need for babel with CommonJS)
  transform: {}
};
