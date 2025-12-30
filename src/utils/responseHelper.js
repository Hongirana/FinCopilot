/**
 * Send a successful response
 * @param {object} res - Express response object
 * @param {object} data - Data to send in the response
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const successResponse = (res, statusCode, message = 'Success', data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {array} details - Additional error details (optional)
 */
const errorResponse = (res, statusCode, message = 'Success', details = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode
    }
  };

  if (details) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
}