const errorResponse = require('../../../src/utils/errorResponse');

describe('Error Response Template - Unit Tests', () => {
  
  test('should have correct structure', () => {
    expect(errorResponse).toBeDefined();
    expect(errorResponse).toHaveProperty('success', false);
    expect(errorResponse).toHaveProperty('error');
  });
  
  test('should have error object with required fields', () => {
    expect(errorResponse.error).toHaveProperty('message');
    expect(errorResponse.error).toHaveProperty('statusCode');
    expect(errorResponse.error).toHaveProperty('errors');
  });
  
  test('should have validation error structure', () => {
    expect(errorResponse.error.message).toBe('Validation failed');
    expect(errorResponse.error.statusCode).toBe(400);
    expect(Array.isArray(errorResponse.error.errors)).toBe(true);
  });
  
  test('should have field-level error details', () => {
    const errors = errorResponse.error.errors;
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toHaveProperty('field');
    expect(errors[0]).toHaveProperty('message');
  });
});
