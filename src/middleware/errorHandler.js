const {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} = require('../utils/customErrors');


const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Global Error Handler
 * Processes all errors and sends consistent responses
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error for debugging (in development show full stack, in production log to file)
  if (process.env.NODE_ENV === 'development') {
    console.log('Error Details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
  } else {
    console.log('Error:', err.message);
  }

  // Handle Prisma Errors
  if (err.code && err.code.startsWith('P')) {
    error = handlePrismaError(err);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token. Please login again');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired. Please login again');
  }

  // Handle Validation Errors (from express-validator)
  if (err.name === 'ValidationError') {
    error = new ValidationError('Validation failed', err.errors);
  }

  // Handle Multer Errors (file upload)
  if (err.name === 'MulterError') {
    error = new ValidationError(`File upload error: ${err.message}`);
  }

  // Default to AppError if not already an operational error
  if (!error.isOperational) {
    error = new AppError(
      error.message || 'Something went wrong',
      error.statusCode || 500,
      'INTERNAL_ERROR'
    );
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.errorCode || 'ERROR',
      message: error.message,
      ...(error.details && { details: error.details }),
      timestamp: error.timestamp || new Date().toISOString()
    },
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle Prisma-specific errors
 * Maps Prisma error codes to custom errors
 */
const handlePrismaError = (err) => {
  switch (err.code) {
    // Unique constraint violation
    case 'P2002':
      const field = err.meta?.target?.[0] || 'field';
      return new ConflictError(
        `A record with this ${field} already exists`,
        { field, constraint: 'unique' }
      );

    // Record not found
    case 'P2025':
      return new NotFoundError('The requested record was not found');

    // Foreign key constraint failed
    case 'P2003':
      const foreignKey = err.meta?.field_name || 'related record';
      return new ValidationError(
        `Invalid reference: ${foreignKey} does not exist`,
        { field: foreignKey }
      );

    // Required field missing
    case 'P2011':
      const missingField = err.meta?.constraint || 'required field';
      return new ValidationError(
        `${missingField} is required`,
        { field: missingField }
      );

    // Invalid data type
    case 'P2006':
      return new ValidationError('Invalid data type provided');

    // Database connection error
    case 'P1001':
    case 'P1002':
    case 'P1008':
      return new DatabaseError('Database connection failed. Please try again later');

    // Query timeout
    case 'P2024':
      return new DatabaseError('Database query timeout. Please try again');

    // Default Prisma error
    default:
      return new DatabaseError(
        'Database operation failed',
        { code: err.code, details: err.meta }
      );
  }
};

/**
 * Request Logger Middleware (optional)
 * Logs all incoming requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(
      `${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
};

module.exports = {
  asyncHandler,
  notFoundHandler,
  errorHandler,
  requestLogger
};
