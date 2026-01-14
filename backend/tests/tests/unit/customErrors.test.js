const {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} = require('../../../src/utils/customErrors');

describe('Custom Error Classes - Unit Tests', () => {
  
  describe('AppError (Base Class)', () => {
    
    test('should create AppError with all properties', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR', { detail: 'test' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });
    
    test('should have default errorCode', () => {
      const error = new AppError('Test', 400);
      expect(error.errorCode).toBe('APP_ERROR');
    });
    
    test('should capture stack trace', () => {
      const error = new AppError('Test', 500);
      expect(error.stack).toBeDefined();
    });
  });
  
  describe('ValidationError', () => {
    
    test('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
    
    test('should work without details', () => {
      const error = new ValidationError('Invalid data');
      expect(error.details).toBeNull();
    });
  });
  
  describe('DatabaseError', () => {
    
    test('should create DatabaseError with correct properties', () => {
      const error = new DatabaseError('Connection failed');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('DATABASE_ERROR');
    });
  });
  
  describe('AuthenticationError', () => {
    
    test('should create AuthenticationError with correct properties', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('AUTHENTICATION_ERROR');
    });
  });
  
  describe('AuthorizationError', () => {
    
    test('should create AuthorizationError with correct properties', () => {
      const error = new AuthorizationError('Access denied');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('AUTHORIZATION_ERROR');
    });
  });
  
  describe('NotFoundError', () => {
    
    test('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('User not found');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND_ERROR');
    });
  });
  
  describe('ConflictError', () => {
    
    test('should create ConflictError with correct properties', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('CONFLICT_ERROR');
    });
  });
  
  describe('Error Inheritance', () => {
    
    test('all custom errors should be instances of Error', () => {
      const errors = [
        new ValidationError('test'),
        new DatabaseError('test'),
        new AuthenticationError('test'),
        new AuthorizationError('test'),
        new NotFoundError('test'),
        new ConflictError('test')
      ];
      
      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
      });
    });
  });
});
