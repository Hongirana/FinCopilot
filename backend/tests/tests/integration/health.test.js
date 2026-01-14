const request = require('supertest');
const { createTestApp } = require('../../helpers/testServer');
const { prisma } = require('../../helpers/testDb');

const app = createTestApp();

describe('Setup Verification Tests', () => {
  
  describe('Version Checks', () => {
    test('should verify Jest 30.x is installed', () => {
      const version = require('jest/package.json').version;
      expect(version).toMatch(/^30\./);
    });
    
    test('should verify Supertest 7.x is installed', () => {
      const version = require('supertest/package.json').version;
      expect(version).toMatch(/^7\./);
    });
    
    test('should verify Express 5.x is installed', () => {
      const version = require('express/package.json').version;
      expect(version).toMatch(/^5\./);
    });
    
    test('should verify Prisma 7.x is installed', () => {
      const version = require('@prisma/client/package.json').version;
      expect(version).toMatch(/^7\./);
    });
  });
  
  describe('Express App Tests', () => {
    test('should create Express app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });
    
    test('should respond to health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('express', '5.x');
    });
    
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
  
  describe('Database Connection Tests', () => {
    test('should connect to test database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as result`;
      expect(result).toBeDefined();
      expect(result[0].result).toBe(1);
    });
    
    test('should have clean database', async () => {
      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });
  });
  
  describe('Modern JavaScript Features', () => {
    test('should support async/await', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });
    
    test('should support modern array methods', () => {
      const arr = [1, 2, 3, 4, 5];
      const doubled = arr.map(x => x * 2);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
    });
  });
});
