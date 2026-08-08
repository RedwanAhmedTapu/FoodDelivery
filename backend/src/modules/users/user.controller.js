const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const userService = require('./user.service');

const getMe = catchAsync(async (req, res) => {
  ApiResponse.success(res, { message: 'Profile fetched', data: req.user.toSafeJSON() });
});

const updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  ApiResponse.success(res, { message: 'Profile updated', data: user.toSafeJSON() });
});

const updateMyAvatar = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image file is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const user = await userService.updateAvatar(req.user._id, req.file.buffer, dataUri);
  ApiResponse.success(res, { message: 'Avatar updated', data: user.toSafeJSON() });
});

// SUPER_ADMIN only
const listUsers = catchAsync(async (req, res) => {
  const { items, meta } = await userService.listUsers(req.query);
  ApiResponse.success(res, { message: 'Users fetched', data: items, meta });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.success(res, { message: 'User fetched', data: user.toSafeJSON() });
});

const setActiveStatus = catchAsync(async (req, res) => {
  const user = await userService.setActiveStatus(req.params.id, req.body.isActive);
  ApiResponse.success(res, { message: 'User status updated', data: user.toSafeJSON() });
});

module.exports = { getMe, updateMe, updateMyAvatar, listUsers, getUserById, setActiveStatus };
