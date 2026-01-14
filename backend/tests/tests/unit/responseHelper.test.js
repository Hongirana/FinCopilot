const { successResponse, errorResponse } = require('../../../src/utils/responseHelper');

describe('Response Helper - Unit Tests', () => {
  
  let mockRes;
  
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('successResponse', () => {
    
    test('should send success response with data', () => {
      const testData = { id: 1, name: 'Test' };
      
      successResponse(mockRes, 200, 'Success', testData);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: testData
      });
    });
    
    test('should send success response without data', () => {
      successResponse(mockRes, 201, 'Created');
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: null
      });
    });
    
    test('should handle custom status codes', () => {
      successResponse(mockRes, 204, 'No Content');
      
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
    
    test('should default message to Success', () => {
      successResponse(mockRes, 200);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: null
      });
    });
  });
  
  describe('errorResponse', () => {
    
    test('should send error response with message', () => {
      errorResponse(mockRes, 400, 'Bad Request');
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Bad Request',
          statusCode: 400
        }
      });
    });
    
    test('should send error response with details', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      
      errorResponse(mockRes, 422, 'Validation Error', details);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          statusCode: 422,
          details: details
        }
      });
    });
    
    test('should handle 500 server errors', () => {
      errorResponse(mockRes, 500, 'Internal Server Error');
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
    
    test('should not include details if not provided', () => {
      errorResponse(mockRes, 404, 'Not Found');
      
      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.error.details).toBeUndefined();
    });
  });
});
