function errorHandler(err, req, res) {
    // Log error details (server-side only)
    console.error('\\n' + '='.repeat(70));
    console.error('❌ ERROR:', err.name);
    console.error('📍 Path:', req.method, req.path);
    console.error('💬 Message:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error('📋 Stack:', err.stack);
    }
    console.error('='.repeat(70) + '\\n');

    // Default error response
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Prisma errors
    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found';
    }

    if (err.code === 'P2002') {
        statusCode = 409;
        message = 'Unique constraint failed';
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
}

module.exports = errorHandler;