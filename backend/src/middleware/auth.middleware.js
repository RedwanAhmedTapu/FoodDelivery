const { verifyAccessToken } = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const User = require('../modules/users/user.model');

const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication token is required');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(decoded.sub).select('-password');
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated');
  }

  req.user = user;
  next();
});

// Attaches user if token present, but does not fail the request if absent.
const optionalAuth = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select('-password');
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
});

module.exports = { authenticate, optionalAuth };
