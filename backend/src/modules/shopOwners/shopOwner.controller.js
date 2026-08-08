const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./shopOwner.service');

const getMyProfile = catchAsync(async (req, res) => {
  const profile = await service.getMyProfile(req.user._id);
  ApiResponse.success(res, { message: 'Profile fetched', data: profile });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const profile = await service.updateMyProfile(req.user._id, req.body);
  ApiResponse.success(res, { message: 'Profile updated', data: profile });
});

const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const profile = await service.uploadProfileImage(req.user._id, dataUri);
  ApiResponse.success(res, { message: 'Profile image uploaded', data: profile });
});

const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Document image is required' });
  const { type } = req.body;
  if (!type) return ApiResponse.error(res, { statusCode: 400, message: 'Document type is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const profile = await service.uploadDocument(req.user._id, type, dataUri);
  ApiResponse.success(res, { message: 'Document uploaded', data: profile });
});

const listShopOwners = catchAsync(async (req, res) => {
  const { items, meta } = await service.listShopOwners(req.query);
  ApiResponse.success(res, { message: 'Shop owners fetched', data: items, meta });
});

const setApprovalStatus = catchAsync(async (req, res) => {
  const { approvalStatus, rejectionReason } = req.body;
  const profile = await service.setApprovalStatus(req.params.id, approvalStatus, rejectionReason);
  ApiResponse.success(res, { message: 'Approval status updated', data: profile });
});

const setStatus = catchAsync(async (req, res) => {
  const profile = await service.setStatus(req.params.id, req.body.status);
  ApiResponse.success(res, { message: 'Status updated', data: profile });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  uploadDocument,
  listShopOwners,
  setApprovalStatus,
  setStatus,
};
