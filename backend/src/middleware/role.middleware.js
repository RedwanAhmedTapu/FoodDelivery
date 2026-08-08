const ApiError = require('../utils/ApiError');

/**
 * Restrict route access to specific roles.
 * Usage: requireRole('SUPER_ADMIN', 'SHOP_OWNER')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { requireRole };
