const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./order.service');
const { emitOrderEvent } = require('../../sockets');

const createOrder = catchAsync(async (req, res) => {
  const order = await service.createOrder(req.user._id, req.body);
  emitOrderEvent('order:new', order, order);
  ApiResponse.success(res, { statusCode: 201, message: 'Order placed successfully', data: order });
});

const getOrder = catchAsync(async (req, res) => {
  const order = await service.getOrderById(req.params.id);
  service.assertParticipant(order, req.user);
  ApiResponse.success(res, { message: 'Order fetched', data: order });
});

const updateStatus = catchAsync(async (req, res) => {
  const order = await service.updateOrderStatus(req.params.id, req.user, req.body.status);
  emitOrderEvent('order:status', order, {
    orderId: order._id,
    status: order.orderStatus,
  });
  ApiResponse.success(res, { message: 'Order status updated', data: order });
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await service.cancelOrder(req.params.id, req.user, req.body.reason);
  emitOrderEvent('order:status', order, {
    orderId: order._id,
    status: order.orderStatus,
  });
  ApiResponse.success(res, { message: 'Order cancelled', data: order });
});

const verifyDelivery = catchAsync(async (req, res) => {
  const order = await service.verifyDeliveryOtp(req.params.id, req.user, req.body.otp);
  ApiResponse.success(res, { message: 'Delivery confirmed', data: order });
});

const listMyOrders = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMyOrders(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Orders fetched', data: items, meta });
});

const listStoreOrders = catchAsync(async (req, res) => {
  const { items, meta } = await service.listStoreOrders(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Store orders fetched', data: items, meta });
});

const listAllOrders = catchAsync(async (req, res) => {
  const { items, meta } = await service.listAllOrders(req.query);
  ApiResponse.success(res, { message: 'All orders fetched', data: items, meta });
});

module.exports = {
  createOrder,
  getOrder,
  updateStatus,
  cancelOrder,
  verifyDelivery,
  listMyOrders,
  listStoreOrders,
  listAllOrders,
};
