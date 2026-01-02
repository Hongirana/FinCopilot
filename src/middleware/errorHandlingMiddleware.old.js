const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(err); // Log the error to the console

  // Set the status code based on the error type
  let statusCode = err.status || 500;

  // If the error is due to validation, set the status code to 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Return a standardized error response
  res.status(statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors || [],
  });

  next();
};

module.exports = errorHandlerMiddleware;