// middlewares/errorHandler.js

/**
 * Standard error response handler
 * Formats errors consistently across all API endpoints
 * 
 * @param {object} res - Next.js API response
 * @param {Error|string|any} error - Error object or message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function sendError(res, error, statusCode = 500) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : 'Error';

  console.error(`API Error (${statusCode}):`, errorMessage, error);

  const response = {
    error: errorName,
    message: errorMessage,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    response.details = {
      stack: error.stack,
    };
  }

  res.status(statusCode).json(response);
}

/**
 * Success response handler
 * @param {object} res - Next.js API response
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Validation error handler
 * @param {object} res - Next.js API response
 * @param {any} errors - Validation errors
 */
function sendValidationError(res, errors) {
  res.status(400).json({
    error: 'Validation Error',
    message: 'Invalid request data',
    details: errors,
  });
}

/**
 * Not found error handler
 * @param {object} res - Next.js API response
 * @param {string} resource - Resource name
 */
function sendNotFound(res, resource = 'Resource') {
  res.status(404).json({
    error: 'Not Found',
    message: `${resource} not found`,
  });
}

/**
 * Unauthorized error handler
 * @param {object} res - Next.js API response
 * @param {string} message - Custom message
 */
function sendUnauthorized(res, message = 'Unauthorized access') {
  res.status(401).json({
    error: 'Unauthorized',
    message,
  });
}

/**
 * Method not allowed error handler
 * @param {object} res - Next.js API response
 * @param {string[]} allowedMethods - Array of allowed HTTP methods
 */
function sendMethodNotAllowed(res, allowedMethods) {
  res.setHeader('Allow', allowedMethods.join(', '));
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `Only ${allowedMethods.join(', ')} requests are allowed`,
    allowedMethods,
  });
}

module.exports = {
  sendError,
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendMethodNotAllowed,
};
