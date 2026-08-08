const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const authService = require('./auth.service');

const respondWithAuth = (res, statusCode, message, user, tokens) =>
  ApiResponse.success(res, {
    statusCode,
    message,
    data: { user: user.toSafeJSON(), ...tokens },
  });

const registerCustomer = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.registerUser(req.body, 'CUSTOMER');
  respondWithAuth(res, 201, 'Customer registered successfully', user, tokens);
});

const registerShopOwner = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.registerUser(req.body, 'SHOP_OWNER');
  respondWithAuth(res, 201, 'Shop owner registered successfully', user, tokens);
});

const registerDeliveryBoy = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.registerUser(req.body, 'DELIVERY_BOY');
  respondWithAuth(res, 201, 'Delivery boy registered successfully', user, tokens);
});

const login = catchAsync(async (req, res) => {
  const { identifier, password } = req.body;
  const { user, tokens } = await authService.loginUser(identifier, password);
  respondWithAuth(res, 200, 'Login successful', user, tokens);
});

const refresh = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.refreshTokens(req.body.refreshToken);
  respondWithAuth(res, 200, 'Token refreshed', user, tokens);
});

const logout = catchAsync(async (req, res) => {
  await authService.logoutUser(req.user._id);
  ApiResponse.success(res, { message: 'Logged out successfully' });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetToken = await authService.forgotPassword(req.body.identifier);
  ApiResponse.success(res, {
    message: 'If the account exists, a reset link has been sent',
    // resetToken only returned here for development/testing purposes
    data: process.env.NODE_ENV === 'production' ? {} : { resetToken },
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  ApiResponse.success(res, { message: 'Password reset successfully' });
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  ApiResponse.success(res, { message: 'Password changed successfully' });
});

module.exports = {
  registerCustomer,
  registerShopOwner,
  registerDeliveryBoy,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
