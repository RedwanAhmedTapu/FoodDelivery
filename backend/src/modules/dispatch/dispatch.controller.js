const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./dispatch.service');

const acceptOffer = catchAsync(async (req, res) => {
  const order = await service.acceptOffer(req.user._id, req.params.attemptId);
  ApiResponse.success(res, { message: 'Delivery accepted', data: order });
});

const rejectOffer = catchAsync(async (req, res) => {
  await service.rejectOffer(req.user._id, req.params.attemptId);
  ApiResponse.success(res, { message: 'Offer declined' });
});

// Manual re-trigger, e.g. from the admin/store dashboard if auto-dispatch failed
const retryDispatch = catchAsync(async (req, res) => {
  const result = await service.startDispatch(req.params.orderId);
  ApiResponse.success(res, { message: 'Dispatch restarted', data: result });
});

const verifyPickupPin = catchAsync(async (req, res) => {
  const order = await service.verifyPickupPin(req.params.orderId, req.user._id, req.user.role, req.body.pin);
  ApiResponse.success(res, { message: 'Pickup verified', data: order });
});

module.exports = { acceptOffer, rejectOffer, retryDispatch, verifyPickupPin };
