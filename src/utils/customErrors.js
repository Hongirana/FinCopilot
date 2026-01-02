

class AppError extends Error {
    constructor(message, statusCode, errorCode = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode || 'APP_ERROR';
        this.details = details;
        this.isOperational = true; // Differentiate from programming errors
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

class DatabaseError extends AppError {
    constructor(message, details = null) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

class AuthenticationError extends AppError {
    constructor(message, details = null) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}

class AuthorizationError extends AppError {
    constructor(message, details = null) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
    }
}

class NotFoundError extends AppError {
    constructor(message, details = null) {
        super(message, 404, 'NOT_FOUND_ERROR', details);
    }
}

class ConflictError extends AppError {
    constructor(message, details = null) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}


module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};