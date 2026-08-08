class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = {}, meta } = {}) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      ...(meta ? { meta } : {}),
    });
  }

  static error(res, { statusCode = 400, message = 'Something went wrong', errors = [] } = {}) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    });
  }
}

module.exports = ApiResponse;
