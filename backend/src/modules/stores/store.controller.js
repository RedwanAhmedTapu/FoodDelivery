const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./store.service');

const createStore = catchAsync(async (req, res) => {
  const store = await service.createStore(req.user._id, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Store created successfully', data: store });
});

const getStore = catchAsync(async (req, res) => {
  const store = await service.getStoreById(req.params.id);
  ApiResponse.success(res, { message: 'Store fetched', data: store });
});

const getStoreBySlug = catchAsync(async (req, res) => {
  const store = await service.getStoreBySlug(req.params.slug);
  ApiResponse.success(res, { message: 'Store fetched', data: store });
});

const updateStore = catchAsync(async (req, res) => {
  const store = await service.updateStore(req.params.id, req.user._id, req.user.role, req.body);
  ApiResponse.success(res, { message: 'Store updated successfully', data: store });
});

const deleteStore = catchAsync(async (req, res) => {
  await service.deleteStore(req.params.id, req.user._id, req.user.role);
  ApiResponse.success(res, { message: 'Store deleted successfully' });
});

const activateStore = catchAsync(async (req, res) => {
  const store = await service.setActivation(req.params.id, req.user._id, req.user.role, true);
  ApiResponse.success(res, { message: 'Store activated', data: store });
});

const deactivateStore = catchAsync(async (req, res) => {
  const store = await service.setActivation(req.params.id, req.user._id, req.user.role, false);
  ApiResponse.success(res, { message: 'Store deactivated', data: store });
});

const setApprovalStatus = catchAsync(async (req, res) => {
  const { approvalStatus, rejectionReason } = req.body;
  const store = await service.setApprovalStatus(req.params.id, approvalStatus, rejectionReason);
  ApiResponse.success(res, { message: 'Store approval status updated', data: store });
});

const getMyStores = catchAsync(async (req, res) => {
  const { items, meta } = await service.getMyStores(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Stores fetched', data: items, meta });
});

const listActiveStores = catchAsync(async (req, res) => {
  const { items, meta } = await service.listActiveStores(req.query);
  ApiResponse.success(res, { message: 'Stores fetched', data: items, meta });
});

const listAllForAdmin = catchAsync(async (req, res) => {
  const { items, meta } = await service.listAllForAdmin(req.query);
  ApiResponse.success(res, { message: 'All stores fetched', data: items, meta });
});

const findNearbyStores = catchAsync(async (req, res) => {
  const { items, meta } = await service.findNearbyStores(req.query);
  ApiResponse.success(res, { message: 'Nearby stores fetched', data: items, meta });
});

const uploadLogo = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const store = await service.uploadStoreImage(req.params.id, req.user._id, req.user.role, 'logo', dataUri);
  ApiResponse.success(res, { message: 'Logo uploaded', data: store });
});

const uploadCoverImage = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const store = await service.uploadStoreImage(
    req.params.id,
    req.user._id,
    req.user.role,
    'coverImage',
    dataUri
  );
  ApiResponse.success(res, { message: 'Cover image uploaded', data: store });
});

module.exports = {
  createStore,
  getStore,
  getStoreBySlug,
  updateStore,
  deleteStore,
  activateStore,
  deactivateStore,
  setApprovalStatus,
  getMyStores,
  listActiveStores,
  listAllForAdmin,
  findNearbyStores,
  uploadLogo,
  uploadCoverImage,
};
