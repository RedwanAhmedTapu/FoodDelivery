const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./deliveryBoy.service');
const assignmentService = require('../deliveryTracking/deliveryAssignment.service');
const { emitToUser } = require('../../sockets');

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

const setOnlineStatus = catchAsync(async (req, res) => {
  const profile = await service.setOnlineStatus(req.user._id, req.body.isOnline);
  ApiResponse.success(res, { message: 'Status updated', data: profile });
});

const updateLocation = catchAsync(async (req, res) => {
  const profile = await service.updateLocation(req.user._id, req.body.coordinates);
  ApiResponse.success(res, { message: 'Location updated', data: profile });
});

const getMyAssignedOrders = catchAsync(async (req, res) => {
  const { items, meta } = await assignmentService.getMyAssignedOrders(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Assigned deliveries fetched', data: items, meta });
});

const acceptDelivery = catchAsync(async (req, res) => {
  const order = await assignmentService.acceptDelivery(req.user._id, req.params.orderId);
  emitToUser(order.customerId, 'delivery:assigned', { orderId: order._id });
  ApiResponse.success(res, { message: 'Delivery accepted', data: order });
});

const completeDelivery = catchAsync(async (req, res) => {
  const order = await assignmentService.completeDelivery(req.user._id, req.params.orderId);
  ApiResponse.success(res, { message: 'Delivery marked complete', data: order });
});

// Admin
const listAll = catchAsync(async (req, res) => {
  const { items, meta } = await service.listAll(req.query);
  ApiResponse.success(res, { message: 'Delivery boys fetched', data: items, meta });
});

const setApprovalStatus = catchAsync(async (req, res) => {
  const profile = await service.setApprovalStatus(req.params.id, req.body.status);
  ApiResponse.success(res, { message: 'Approval status updated', data: profile });
});

// Socket notifications (to both the rider and the customer) are emitted
// inside assignmentService.assignManually itself — it has the DeliveryBoy
// document loaded and can target the rider's actual userId. Emitting here
// from `order.deliveryBoyId` (the DeliveryBoy document's own _id) targeted
// a room nobody ever joins, so the rider silently never got notified.
const assignManually = catchAsync(async (req, res) => {
  const order = await assignmentService.assignManually(req.params.orderId, req.body.deliveryBoyId);
  ApiResponse.success(res, { message: 'Delivery boy assigned', data: order });
});

const assignAutomatically = catchAsync(async (req, res) => {
  const order = await assignmentService.assignAutomatically(req.params.orderId);
  ApiResponse.success(res, { message: 'Delivery boy auto-assigned', data: order });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  setOnlineStatus,
  updateLocation,
  getMyAssignedOrders,
  acceptDelivery,
  completeDelivery,
  listAll,
  setApprovalStatus,
  assignManually,
  assignAutomatically,
};
