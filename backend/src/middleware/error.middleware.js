const ApiError = require('../utils/ApiError');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let errors = [];

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errors = Object.values(error.errors).map((e) => e.message);
      message = 'Validation failed';
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0];
      message = field ? `${field} already exists` : 'Duplicate value';
    }

    // Mongoose invalid ObjectId
    if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid value for ${error.path}`;
    }

    error = new ApiError(statusCode, message, errors);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // eslint-disable-next-line no-console
  if (error.statusCode >= 500) console.error(err);

  res.status(error.statusCode).json(response);
}

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
}

module.exports = { errorHandler, notFoundHandler };
