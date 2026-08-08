const Order = require('./order.model');
const Cart = require('../carts/cart.model');
const Store = require('../stores/store.model');
const Food = require('../foods/food.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const runTransaction = require('../../utils/runTransaction');
const { generateOrderNumber } = require('../../utils/generateOrderNumber');
const { getPagination, paginate } = require('../../utils/pagination');
const { calculateOrderPricing } = require('./orderPricing.service');
const pointService = require('../points/point.service');
const referralService = require('../referrals/referral.service');
const foodService = require('../foods/food.service');
const notificationService = require('../notifications/notification.service');

const STATUS_NOTIFICATION_MAP = {
  ACCEPTED: { type: 'ORDER_ACCEPTED', title: 'Order accepted', message: 'Your order has been accepted by the store.' },
  REJECTED: { type: 'ORDER_REJECTED', title: 'Order rejected', message: 'Your order was rejected by the store.' },
  PREPARING: { type: 'FOOD_PREPARING', title: 'Preparing your food', message: 'The store has started preparing your order.' },
  READY_FOR_PICKUP: { type: 'FOOD_READY', title: 'Order ready', message: 'Your order is ready for pickup.' },
  ASSIGNED_TO_DELIVERY: { type: 'DELIVERY_ASSIGNED', title: 'Delivery assigned', message: 'A delivery partner has been assigned to your order.' },
  PICKED_UP: { type: 'DELIVERY_PICKED_UP', title: 'Order picked up', message: 'Your order has been picked up for delivery.' },
  ON_THE_WAY: { type: 'DELIVERY_ON_THE_WAY', title: 'On the way', message: 'Your order is on the way!' },
  DELIVERED: { type: 'ORDER_DELIVERED', title: 'Delivered', message: 'Your order has been delivered. Enjoy your meal!' },
};


const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'ON_THE_WAY'];

/**
 * Valid forward transitions for order status. Enforced so that, e.g., a
 * PENDING order cannot jump directly to DELIVERED.
 */
const ALLOWED_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['ASSIGNED_TO_DELIVERY', 'CANCELLED'],
  // PICKED_UP is set only via dispatch.service.verifyPickupPin (the store
  // confirms the rider's PIN) — not through this generic status endpoint.
  ASSIGNED_TO_DELIVERY: ['CANCELLED'],
  PICKED_UP: ['ON_THE_WAY'],
  // DELIVERED is set only via verifyDeliveryOtp below (the customer's OTP
  // confirms the rider at the door) — not through this generic endpoint.
  ON_THE_WAY: [],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

async function createOrder(customerId, payload) {
  const cart = await Cart.findOne({ userId: customerId });
  if (!cart || !cart.items.length || !cart.storeId) {
    throw ApiError.badRequest('Cart is empty');
  }

  const store = await Store.findById(cart.storeId);
  if (!store) throw ApiError.notFound('Store not found');
  if (!store.isActive || store.approvalStatus !== 'APPROVED') {
    throw ApiError.badRequest('This store is not currently accepting orders');
  }

  const subtotalCheck = cart.items.reduce(
    (sum, i) => sum + (i.unitPrice + i.addons.reduce((s, a) => s + a.price, 0)) * i.quantity,
    0
  );
  if (subtotalCheck < store.minimumOrder) {
    throw ApiError.badRequest(`Minimum order amount is ${store.minimumOrder}`);
  }

  // Re-validate every food item is still active/available/in stock (never trust cart snapshot alone)
  const foodIds = cart.items.map((i) => i.foodId);
  const foods = await Food.find({ _id: { $in: foodIds } });
  const foodMap = new Map(foods.map((f) => [f._id.toString(), f]));

  cart.items.forEach((item) => {
    const food = foodMap.get(item.foodId.toString());
    if (!food || !food.isActive || !food.availability) {
      throw ApiError.badRequest(`"${item.name}" is no longer available`);
    }
    if (food.stock !== null && food.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${item.name}"`);
    }
  });

  const customer = await User.findById(customerId);

  const pricing = await calculateOrderPricing({
    items: cart.items,
    storeCoordinates: store.location.coordinates,
    deliveryCoordinates: payload.deliveryCoordinates,
    requestedPointsToRedeem: payload.pointsToRedeem || 0,
    customerPointsBalance: customer.pointsBalance,
  });

  const orderItems = cart.items.map((item) => ({
    foodId: item.foodId,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    variant: item.variant,
    addons: item.addons,
    notes: item.notes,
    lineTotal:
      Math.round((item.unitPrice + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity * 100) / 100,
  }));

  const order = await runTransaction(async (session) => {
    const sessionOpt = session ? { session } : {};

    const [createdOrder] = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          customerId,
          storeId: store._id,
          ownerId: store.ownerId,
          items: orderItems,
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          pointsUsed: pricing.pointsUsed,
          pointDiscount: pricing.pointDiscount,
          deliveryFee: pricing.deliveryFee,
          platformFee: pricing.platformFee,
          tax: pricing.tax,
          total: pricing.total,
          paymentMethod: payload.paymentMethod || 'COD',
          deliveryAddress: payload.deliveryAddress,
          deliveryLocation: { type: 'Point', coordinates: payload.deliveryCoordinates },
          referralCode: payload.referralCode || null,
          notes: payload.notes,
          estimatedDeliveryTime: store.estimatedDeliveryTime,
        },
      ],
      sessionOpt
    );

    // Deduct redeemed points via ledger
    if (pricing.pointsUsed > 0) {
      await pointService.applyPointTransaction(
        {
          userId: customerId,
          type: 'REDEEM',
          points: -pricing.pointsUsed,
          referenceType: 'Order',
          referenceId: createdOrder._id,
          description: `Points redeemed for order ${createdOrder.orderNumber}`,
        },
        session
      );
    }

    // Reduce stock for items with tracked inventory
    await Promise.all(
      orderItems.map(async (item) => {
        const food = foodMap.get(item.foodId.toString());
        if (food.stock !== null) {
          food.stock -= item.quantity;
          if (food.stock <= 0) {
            food.stock = 0;
            food.availability = false;
          }
          await food.save(sessionOpt);
        }
      })
    );

    // Clear cart
    cart.items = [];
    cart.storeId = null;
    await cart.save(sessionOpt);

    // Track user order count
    await User.findByIdAndUpdate(customerId, { $inc: { totalOrders: 1 } }, sessionOpt);

    return createdOrder;
  });

  return order;
}

async function getOrderById(id) {
  const order = await Order.findById(id).populate('storeId customerId deliveryBoyId');
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

/**
 * customerId/ownerId may be a raw ObjectId OR a populated document
 * (getOrderById populates customerId) — Mongoose documents don't override
 * .toString() to return their id, so comparing a populated field directly
 * against a user id string always fails. Always resolve through ._id first.
 */
function toIdString(value) {
  if (!value) return null;
  return (value._id || value).toString();
}

function assertParticipant(order, user) {
  const { role, _id } = user;
  if (role === 'SUPER_ADMIN') return;
  if (role === 'CUSTOMER' && toIdString(order.customerId) === _id.toString()) return;
  if (role === 'SHOP_OWNER' && toIdString(order.ownerId) === _id.toString()) return;
  throw ApiError.forbidden('You are not authorized to view this order');
}

async function updateOrderStatus(orderId, actor, newStatus) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (actor.role === 'SHOP_OWNER' && order.ownerId.toString() !== actor._id.toString()) {
    throw ApiError.forbidden('You do not own the store for this order');
  }

  const allowedNext = ALLOWED_TRANSITIONS[order.orderStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    throw ApiError.badRequest(`Cannot transition order from ${order.orderStatus} to ${newStatus}`);
  }

  order.orderStatus = newStatus;
  const timestampField = {
    ACCEPTED: 'acceptedAt',
    PREPARING: 'preparedAt',
    PICKED_UP: 'pickedUpAt',
    DELIVERED: 'deliveredAt',
    CANCELLED: 'cancelledAt',
  }[newStatus];
  if (timestampField) order[timestampField] = new Date();

  await order.save();

  if (newStatus === 'DELIVERED') {
    await onOrderDelivered(order);
  }
  if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
    await refundOnCancellation(order);
  }
  if (newStatus === 'READY_FOR_PICKUP') {
    // Kick off the rider search/offer cascade automatically — this is what
    // the store marking "ready" actually triggers in the real flow, rather
    // than requiring a separate manual "assign" action every time.
    try {
      // eslint-disable-next-line global-require
      const dispatchService = require('../dispatch/dispatch.service');
      await dispatchService.startDispatch(order._id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[dispatch] Failed to start dispatch:', err.message);
    }
  }

  const notif = STATUS_NOTIFICATION_MAP[newStatus];
  if (notif) {
    await notificationService.notify(order.customerId, {
      ...notif,
      referenceType: 'Order',
      referenceId: order._id,
    });
  }

  // Live-push the new status to everyone tracking this order (customer,
  // store, admins, and the rider's dashboard once it has joined the room).
  // This was previously missing entirely on this generic path, so e.g. the
  // rider tapping "Start delivering" (PICKED_UP -> ON_THE_WAY) never showed
  // up on the customer's tracking page until they manually refreshed.
  // eslint-disable-next-line global-require
  const { emitOrderEvent } = require('../../sockets');
  emitOrderEvent('order:status', order, { orderId: order._id, status: order.orderStatus });

  return order;
}

/**
 * Customer's OTP, entered by the rider at the door, confirms this rider is
 * actually delivering THIS order — the free, no-SMS-gateway OTP flow.
 * Limits attempts to prevent brute-forcing a short numeric code.
 */
async function verifyDeliveryOtp(orderId, actor, otp) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.orderStatus !== 'ON_THE_WAY') {
    throw ApiError.badRequest('Order must be on the way before delivery can be confirmed');
  }
  if (order.deliveryOtpAttempts >= 5) {
    throw ApiError.badRequest('Too many incorrect attempts. Ask the customer to re-check their OTP.');
  }
  if (!order.deliveryOtp || order.deliveryOtp !== otp) {
    order.deliveryOtpAttempts += 1;
    await order.save();
    throw ApiError.badRequest('Incorrect delivery OTP');
  }

  order.orderStatus = 'DELIVERED';
  order.deliveredAt = new Date();
  order.deliveryVerifiedAt = new Date();
  await order.save();

  await onOrderDelivered(order);

  const notif = STATUS_NOTIFICATION_MAP.DELIVERED;
  if (notif) {
    await notificationService.notify(order.customerId, { ...notif, referenceType: 'Order', referenceId: order._id });
  }

  const { emitOrderEvent } = require('../../sockets');
  emitOrderEvent('order:status', order, { orderId: order._id, status: order.orderStatus });

  return order;
}

/** Reward points earned + referral bonus once an order is confirmed delivered. */
async function onOrderDelivered(order) {
  const settings = await require('../platformSettings/platformSettings.model').getSettings();
  const earnedPoints = Math.floor((order.subtotal / 100) * settings.pointsRules.earnRatePer100);

  if (earnedPoints > 0) {
    await pointService.applyPointTransaction({
      userId: order.customerId,
      type: 'EARN',
      points: earnedPoints,
      referenceType: 'Order',
      referenceId: order._id,
      description: `Points earned for order ${order.orderNumber}`,
    });
  }

  await Store.findByIdAndUpdate(order.storeId, { $inc: { totalOrders: 1 } });
  await Promise.all(order.items.map((item) => foodService.adjustStock(item.foodId, 0))); // stock already adjusted at creation

  if (order.referralCode) {
    try {
      const referral = await referralService.resolveReferral(order.referralCode);
      await referralService.rewardQualifyingOrder(order.customerId, referral._id, order._id);
    } catch (err) {
      // referral resolution failure should not block order completion
    }
  }

  // Credit the store owner + rider wallets now that delivery is confirmed.
  // This happens last, and only here, so a cancelled/refunded order never
  // pays anyone — see wallet.service.settleOrderEarnings for the full split
  // logic (it differs for COD vs online payment).
  try {
    // eslint-disable-next-line global-require
    const walletService = require('../wallet/wallet.service');
    // eslint-disable-next-line global-require
    const DeliveryBoy = require('../delivery/deliveryBoy.model');

    let deliveryBoyUserId = null;
    if (order.deliveryBoyId) {
      const rider = await DeliveryBoy.findById(order.deliveryBoyId).select('userId');
      deliveryBoyUserId = rider?.userId || null;
    }

    await walletService.settleOrderEarnings(order, deliveryBoyUserId);
  } catch (err) {
    // A wallet-settlement failure should never undo a confirmed delivery —
    // log it loudly so an admin can reconcile manually, but don't throw.
    // eslint-disable-next-line no-console
    console.error(`[wallet] Failed to settle earnings for order ${order._id}:`, err.message);
  }
}

/** Restore points and released stock when an order is cancelled/rejected. */
async function refundOnCancellation(order) {
  if (order.pointsUsed > 0) {
    await pointService.applyPointTransaction({
      userId: order.customerId,
      type: 'REFUND',
      points: order.pointsUsed,
      referenceType: 'Order',
      referenceId: order._id,
      description: `Points refunded for cancelled order ${order.orderNumber}`,
    });
  }

  await Promise.all(
    order.items.map(async (item) => {
      const food = await Food.findById(item.foodId);
      if (food && food.stock !== null) {
        food.stock += item.quantity;
        food.availability = true;
        await food.save();
      }
    })
  );

  if (order.paymentStatus === 'PAID') {
    order.paymentStatus = 'REFUNDED';
    await order.save();
  }
}

async function cancelOrder(orderId, actor, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  assertParticipant(order, actor);

  if (!['PENDING', 'ACCEPTED', 'PREPARING'].includes(order.orderStatus)) {
    throw ApiError.badRequest('Order can no longer be cancelled at this stage');
  }

  order.orderStatus = 'CANCELLED';
  order.cancelledAt = new Date();
  order.cancelReason = reason;
  await order.save();
  await refundOnCancellation(order);
  return order;
}

async function listMyOrders(customerId, query) {
  const pagination = getPagination(query);
  const filter = { customerId };
  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  return paginate(Order, filter, pagination, { populate: [{ path: 'storeId', select: 'name logo' }] });
}

async function listStoreOrders(ownerId, query) {
  const pagination = getPagination(query);
  const filter = { ownerId };
  if (query.storeId) filter.storeId = query.storeId;
  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  return paginate(Order, filter, pagination, { populate: [{ path: 'customerId', select: 'name phone' }] });
}

async function listAllOrders(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  return paginate(Order, filter, pagination);
}

module.exports = {
  createOrder,
  getOrderById,
  assertParticipant,
  updateOrderStatus,
  verifyDeliveryOtp,
  cancelOrder,
  listMyOrders,
  listStoreOrders,
  listAllOrders,
  ACTIVE_STATUSES,
  ALLOWED_TRANSITIONS,
};
