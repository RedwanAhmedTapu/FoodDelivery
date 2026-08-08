const Order = require('../orders/order.model');
const DeliveryBoy = require('../delivery/deliveryBoy.model');
const DispatchAttempt = require('../dispatch/dispatchAttempt.model');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');
const deliveryBoyService = require('../delivery/deliveryBoy.service');
const { generateOtp } = require('../../utils/generateOtp');
const { emitOrderEvent, emitToUser } = require('../../sockets');
const notificationService = require('../notifications/notification.service');

/**
 * Admin/store manual override of the auto-dispatch cascade. Mirrors what
 * dispatch.service.acceptOffer does when a rider accepts an offer — same
 * pickupPin generation, same status/dispatchStatus transitions, same socket
 * events — so an order assigned this way behaves identically downstream
 * (store pickup-PIN verification, live tracking, etc.) to one assigned via
 * the normal cascade. Previously this skipped the pickupPin entirely, which
 * left the store with no way to ever verify pickup for these orders, and it
 * never notified the rider (see the controller's old emit, which targeted
 * the DeliveryBoy document's own _id instead of the rider's userId — a room
 * nobody is ever subscribed to).
 */
async function assignManually(orderId, deliveryBoyId) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.orderStatus !== 'READY_FOR_PICKUP') {
    throw ApiError.badRequest('Order must be READY_FOR_PICKUP before assigning a delivery boy');
  }

  const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
  if (!deliveryBoy || deliveryBoy.status !== 'APPROVED') {
    throw ApiError.badRequest('Delivery boy is not available for assignment');
  }

  // Stop the auto-dispatch cascade for this order — otherwise a rider could
  // still accept an earlier PENDING offer after admin already hand-assigned
  // someone else, overwriting deliveryBoyId out from under this assignment.
  await DispatchAttempt.updateMany(
    { orderId: order._id, status: 'PENDING' },
    { status: 'REJECTED', respondedAt: new Date() }
  );

  const pickupPin = generateOtp(env.OTP_LENGTH);

  order.deliveryBoyId = deliveryBoy._id;
  order.orderStatus = 'ASSIGNED_TO_DELIVERY';
  order.dispatchStatus = 'ASSIGNED';
  order.pickupPin = pickupPin;
  await order.save();

  deliveryBoy.isAvailable = false;
  await deliveryBoy.save();

  emitOrderEvent('order:status', order, { orderId: order._id, status: order.orderStatus });
  emitToUser(deliveryBoy.userId, 'delivery:assigned', { orderId: order._id });
  emitToUser(order.customerId, 'delivery:assigned', { orderId: order._id });

  await notificationService.notify(order.customerId, {
    type: 'DELIVERY_ASSIGNED',
    title: 'Rider assigned',
    message: `${deliveryBoy.name} is heading to pick up your order.`,
    referenceType: 'Order',
    referenceId: order._id,
  });

  return order;
}

/**
 * Automatic assignment: finds the nearest online+available delivery boy
 * to the store's location. Architecture supports plugging in workload/
 * scoring logic later (see findNearestAvailable in deliveryBoy.service).
 */
async function assignAutomatically(orderId) {
  const order = await Order.findById(orderId).populate('storeId');
  if (!order) throw ApiError.notFound('Order not found');
  if (order.orderStatus !== 'READY_FOR_PICKUP') {
    throw ApiError.badRequest('Order must be READY_FOR_PICKUP before assigning a delivery boy');
  }

  const nearest = await deliveryBoyService.findNearestAvailable(order.storeId.location.coordinates);
  if (!nearest) throw ApiError.notFound('No available delivery boys nearby');

  return assignManually(orderId, nearest._id);
}

async function acceptDelivery(deliveryBoyUserId, orderId) {
  const deliveryBoy = await DeliveryBoy.findOne({ userId: deliveryBoyUserId });
  if (!deliveryBoy) throw ApiError.notFound('Delivery boy profile not found');

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.deliveryBoyId || order.deliveryBoyId.toString() !== deliveryBoy._id.toString()) {
    throw ApiError.forbidden('This delivery is not assigned to you');
  }

  return order;
}

async function getMyAssignedOrders(deliveryBoyUserId, query) {
  const deliveryBoy = await DeliveryBoy.findOne({ userId: deliveryBoyUserId });
  if (!deliveryBoy) throw ApiError.notFound('Delivery boy profile not found');

  const { getPagination, paginate } = require('../../utils/pagination');
  const pagination = getPagination(query);
  const filter = { deliveryBoyId: deliveryBoy._id };
  if (query.active === 'true') {
    filter.orderStatus = { $in: ['ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'ON_THE_WAY'] };
  }
  return paginate(Order, filter, pagination, { populate: [{ path: 'storeId', select: 'name address location' }] });
}

async function completeDelivery(deliveryBoyUserId, orderId) {
  const deliveryBoy = await DeliveryBoy.findOne({ userId: deliveryBoyUserId });
  if (!deliveryBoy) throw ApiError.notFound('Delivery boy profile not found');

  const order = await Order.findById(orderId);
  if (!order || order.deliveryBoyId?.toString() !== deliveryBoy._id.toString()) {
    throw ApiError.forbidden('This delivery is not assigned to you');
  }

  deliveryBoy.isAvailable = true;
  deliveryBoy.totalDeliveries += 1;
  deliveryBoy.totalEarnings += order.deliveryFee;
  await deliveryBoy.save();

  return order;
}

module.exports = { assignManually, assignAutomatically, acceptDelivery, getMyAssignedOrders, completeDelivery };
