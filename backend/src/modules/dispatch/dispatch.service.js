const DeliveryBoy = require('../delivery/deliveryBoy.model');
const DispatchAttempt = require('./dispatchAttempt.model');
const Order = require('../orders/order.model');
const Store = require('../stores/store.model');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');
const { calculateDistanceKm } = require('../../utils/calculateDistance');
const { generateOtp } = require('../../utils/generateOtp');
const { emitToUser, emitOrderEvent } = require('../../sockets');
const notificationService = require('../notifications/notification.service');

/**
 * Weighted scoring, roughly out of 100. Tuned to be transparent and
 * explainable rather than "optimal" — every factor and its cap is visible
 * here, matching the score breakdown in the dispatch design (distance,
 * acceptance rate, rating, current load, idle/fairness time).
 */
function scoreCandidate(rider, distanceKm, activeOrderCount) {
  const distanceScore = Math.max(0, 40 - distanceKm * 8); // 0km=40, 5km=0
  const acceptanceScore = (rider.acceptanceRate ?? 1) * 20; // 0..20
  const ratingScore = (rider.rating / 5) * 20; // 0..20
  const loadScore = Math.max(0, 10 - activeOrderCount * 5); // fewer active deliveries = better
  const idleMinutes = rider.idleSince ? (Date.now() - rider.idleSince.getTime()) / 60000 : 0;
  const idleScore = Math.min(10, idleMinutes / 3); // fairness: longer idle = more points, caps at 30 min

  return Math.round((distanceScore + acceptanceScore + ratingScore + loadScore + idleScore) * 100) / 100;
}

async function getActiveOrderCounts(riderIds) {
  const counts = await Order.aggregate([
    { $match: { deliveryBoyId: { $in: riderIds }, orderStatus: { $in: ['ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'ON_THE_WAY'] } } },
    { $group: { _id: '$deliveryBoyId', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [c._id.toString(), c.count]));
}

/**
 * Finds and ranks every eligible rider for an order's store location.
 * Eligible = online, available, approved, below the fraud threshold, within
 * the search radius, under the max-concurrent-deliveries cap, and not
 * already offered this order in an earlier cascade round.
 */
async function findRankedCandidates(storeCoordinates, orderId, excludeRiderIds = []) {
  const radiusMeters = env.DISPATCH_SEARCH_RADIUS_KM * 1000;

  const nearby = await DeliveryBoy.find({
    isOnline: true,
    isAvailable: true,
    status: 'APPROVED',
    fraudScore: { $lt: env.FRAUD_SCORE_BLOCK_THRESHOLD },
    _id: { $nin: excludeRiderIds },
    currentLocation: {
      $near: { $geometry: { type: 'Point', coordinates: storeCoordinates }, $maxDistance: radiusMeters },
    },
  }).limit(50);

  if (nearby.length === 0) return [];

  const activeCounts = await getActiveOrderCounts(nearby.map((r) => r._id));

  const scored = nearby
    .map((rider) => {
      const activeOrders = activeCounts.get(rider._id.toString()) || 0;
      const distanceKm = calculateDistanceKm(storeCoordinates, rider.currentLocation.coordinates);
      return {
        rider,
        distanceKm: Math.round(distanceKm * 100) / 100,
        activeOrders,
        score: scoreCandidate(rider, distanceKm, activeOrders),
      };
    })
    .filter((c) => c.activeOrders < env.DISPATCH_MAX_ACTIVE_ORDERS_PER_RIDER);

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

async function offerToRider(order, candidate, rank) {
  const respondBy = new Date(Date.now() + env.DISPATCH_OFFER_WINDOW_SECONDS * 1000);

  const attempt = await DispatchAttempt.create({
    orderId: order._id,
    deliveryBoyId: candidate.rider._id,
    rank,
    score: candidate.score,
    respondBy,
  });

  await DeliveryBoy.findByIdAndUpdate(candidate.rider._id, { $inc: { totalDispatchOffers: 1 } });

  const store = await Store.findById(order.storeId).select('name address location');

  emitToUser(candidate.rider.userId, 'dispatch:offer', {
    attemptId: attempt._id,
    orderId: order._id,
    orderNumber: order.orderNumber,
    storeName: store?.name,
    storeAddress: store?.address,
    deliveryAddress: order.deliveryAddress,
    distanceKm: candidate.distanceKm,
    earning: order.deliveryFee,
    offerWindowSeconds: env.DISPATCH_OFFER_WINDOW_SECONDS,
    respondBy: respondBy.toISOString(),
  });

  return attempt;
}

/**
 * Starts (or resumes) the dispatch cascade for an order: ranks candidates,
 * offers the order to the top-ranked rider not yet tried, and marks the
 * order SEARCHING. If nobody is eligible, marks dispatch FAILED so staff
 * can manually intervene (matches "no riders nearby" reality).
 */
async function startDispatch(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.orderStatus !== 'READY_FOR_PICKUP') {
    throw ApiError.badRequest('Order must be READY_FOR_PICKUP to start dispatch');
  }

  const store = await Store.findById(order.storeId);
  const alreadyTried = await DispatchAttempt.find({ orderId }).distinct('deliveryBoyId');

  const candidates = await findRankedCandidates(store.location.coordinates, orderId, alreadyTried);

  if (candidates.length === 0) {
    order.dispatchStatus = 'FAILED';
    await order.save();
    emitOrderEvent('dispatch:failed', order, {
      orderId: order._id,
      message: 'No available riders nearby right now.',
    });
    return { started: false, reason: 'NO_RIDERS_AVAILABLE' };
  }

  const rank = alreadyTried.length + 1;
  await offerToRider(order, candidates[0], rank);

  order.dispatchStatus = 'SEARCHING';
  order.dispatchAttemptCount += 1;
  await order.save();

  return { started: true, offeredTo: candidates[0].rider._id, rank };
}

/** Rider taps Accept on their offer notification. */
async function acceptOffer(riderUserId, attemptId) {
  const attempt = await DispatchAttempt.findById(attemptId);
  if (!attempt) throw ApiError.notFound('Dispatch offer not found');

  const rider = await DeliveryBoy.findById(attempt.deliveryBoyId);
  if (!rider || rider.userId.toString() !== riderUserId.toString()) {
    throw ApiError.forbidden('This offer is not yours');
  }
  if (attempt.status !== 'PENDING') {
    throw ApiError.badRequest('This offer is no longer available');
  }
  if (attempt.respondBy < new Date()) {
    attempt.status = 'TIMEOUT';
    await attempt.save();
    throw ApiError.badRequest('This offer has expired');
  }

  const order = await Order.findById(attempt.orderId);
  if (!order || order.orderStatus !== 'READY_FOR_PICKUP') {
    attempt.status = 'REJECTED';
    await attempt.save();
    throw ApiError.badRequest('This order is no longer available for pickup');
  }

  attempt.status = 'ACCEPTED';
  attempt.respondedAt = new Date();
  await attempt.save();

  // Generate the pickup PIN now — the store will ask the rider for it.
  const pickupPin = generateOtp(env.OTP_LENGTH);

  order.deliveryBoyId = rider._id;
  order.orderStatus = 'ASSIGNED_TO_DELIVERY';
  order.dispatchStatus = 'ASSIGNED';
  order.pickupPin = pickupPin;
  await order.save();

  rider.isAvailable = false;
  rider.totalDispatchAccepts += 1;
  rider.consecutiveMissedOffers = 0;
  await rider.save();

  emitOrderEvent('order:status', order, { orderId: order._id, status: order.orderStatus });
  emitToUser(order.customerId, 'delivery:assigned', { orderId: order._id });

  await notificationService.notify(order.customerId, {
    type: 'DELIVERY_ASSIGNED',
    title: 'Rider assigned',
    message: `${rider.name} is heading to pick up your order.`,
    referenceType: 'Order',
    referenceId: order._id,
  });

  return order;
}

/** Rider taps Reject, or the cron sweep marks a timed-out offer — cascades to the next candidate. */
async function rejectOrExpireOffer(attemptId, reason = 'REJECTED') {
  const attempt = await DispatchAttempt.findById(attemptId);
  if (!attempt || attempt.status !== 'PENDING') return null;

  attempt.status = reason;
  attempt.respondedAt = new Date();
  await attempt.save();

  if (reason === 'TIMEOUT') {
    await DeliveryBoy.findByIdAndUpdate(attempt.deliveryBoyId, { $inc: { consecutiveMissedOffers: 1 } });
  }

  const order = await Order.findById(attempt.orderId);
  if (!order || order.orderStatus !== 'READY_FOR_PICKUP') return null;

  // Cascade to the next-ranked candidate.
  return startDispatch(order._id);
}

async function rejectOffer(riderUserId, attemptId) {
  const attempt = await DispatchAttempt.findById(attemptId);
  if (!attempt) throw ApiError.notFound('Dispatch offer not found');

  const rider = await DeliveryBoy.findById(attempt.deliveryBoyId);
  if (!rider || rider.userId.toString() !== riderUserId.toString()) {
    throw ApiError.forbidden('This offer is not yours');
  }

  return rejectOrExpireOffer(attemptId, 'REJECTED');
}

/**
 * Cron entry point: finds every PENDING offer whose response window has
 * passed and cascades each to the next candidate. Runs frequently (see
 * jobs/cron.js) so the customer doesn't wait long after a rider ignores
 * an offer.
 */
async function sweepTimedOutOffers() {
  const now = new Date();
  const expired = await DispatchAttempt.find({ status: 'PENDING', respondBy: { $lt: now } });

  let cascaded = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const attempt of expired) {
    // eslint-disable-next-line no-await-in-loop
    await rejectOrExpireOffer(attempt._id, 'TIMEOUT');
    cascaded += 1;
  }
  return cascaded;
}

/** Store verifies the rider's pickup PIN before handing over the food. */
async function verifyPickupPin(orderId, actorId, actorRole, pin) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (actorRole === 'SHOP_OWNER' && order.ownerId.toString() !== actorId.toString()) {
    throw ApiError.forbidden('You do not own the store for this order');
  }
  if (order.orderStatus !== 'ASSIGNED_TO_DELIVERY') {
    throw ApiError.badRequest('Order must be assigned to a rider before pickup verification');
  }
  if (!order.pickupPin || order.pickupPin !== pin) {
    throw ApiError.badRequest('Incorrect pickup PIN');
  }

  order.pickupVerifiedAt = new Date();
  order.orderStatus = 'PICKED_UP';
  order.pickedUpAt = new Date();

  // Generate the delivery OTP now — this is what the customer will give the
  // rider at the door. Sent via Socket.IO push (free) + shown on the order
  // tracking page; email is an optional extra channel (see sendDeliveryOtpEmail).
  order.deliveryOtp = generateOtp(env.OTP_LENGTH);
  await order.save();

  emitOrderEvent('order:status', order, { orderId: order._id, status: order.orderStatus });
  emitToUser(order.customerId, 'delivery:otp', { orderId: order._id, otp: order.deliveryOtp });

  return order;
}

module.exports = {
  scoreCandidate,
  findRankedCandidates,
  startDispatch,
  acceptOffer,
  rejectOffer,
  sweepTimedOutOffers,
  verifyPickupPin,
};
