const Review = require('./review.model');
const Order = require('../orders/order.model');
const Store = require('../stores/store.model');
const Food = require('../foods/food.model');
const ApiError = require('../../utils/ApiError');
const { getPagination, paginate } = require('../../utils/pagination');

async function recalculateStoreRating(storeId) {
  const agg = await Review.aggregate([
    { $match: { storeId, type: 'STORE' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await Store.findByIdAndUpdate(storeId, { rating: Math.round(avg * 10) / 10, totalRatings: count });
}

async function recalculateFoodRating(foodId) {
  const agg = await Review.aggregate([
    { $match: { foodId, type: 'FOOD' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await Food.findByIdAndUpdate(foodId, { rating: Math.round(avg * 10) / 10, totalRatings: count });
}

async function createReview(customerId, payload) {
  const order = await Order.findById(payload.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customerId.toString() !== customerId.toString()) {
    throw ApiError.forbidden('You can only review your own orders');
  }
  if (order.orderStatus !== 'DELIVERED') {
    throw ApiError.badRequest('You can only review orders after delivery');
  }

  if (payload.type === 'FOOD') {
    const purchased = order.items.some((item) => item.foodId.toString() === payload.foodId);
    if (!purchased) throw ApiError.badRequest('You can only review food items you purchased');
  }

  const existing = await Review.findOne({
    orderId: payload.orderId,
    type: payload.type,
    foodId: payload.type === 'FOOD' ? payload.foodId : null,
  });
  if (existing) throw ApiError.conflict('You have already reviewed this. Edit your existing review instead.');

  const review = await Review.create({
    customerId,
    orderId: payload.orderId,
    storeId: order.storeId,
    foodId: payload.type === 'FOOD' ? payload.foodId : null,
    type: payload.type,
    rating: payload.rating,
    comment: payload.comment,
  });

  if (payload.type === 'STORE') await recalculateStoreRating(order.storeId);
  if (payload.type === 'FOOD') await recalculateFoodRating(payload.foodId);

  return review;
}

async function updateReview(reviewId, customerId, updates) {
  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found');
  if (review.customerId.toString() !== customerId.toString()) {
    throw ApiError.forbidden('You can only edit your own reviews');
  }

  if (updates.rating !== undefined) review.rating = updates.rating;
  if (updates.comment !== undefined) review.comment = updates.comment;
  await review.save();

  if (review.type === 'STORE') await recalculateStoreRating(review.storeId);
  if (review.type === 'FOOD') await recalculateFoodRating(review.foodId);

  return review;
}

async function listByStore(storeId, query) {
  const pagination = getPagination(query);
  return paginate(Review, { storeId, type: 'STORE' }, pagination, {
    populate: [{ path: 'customerId', select: 'name avatar' }],
  });
}

async function listByFood(foodId, query) {
  const pagination = getPagination(query);
  return paginate(Review, { foodId, type: 'FOOD' }, pagination, {
    populate: [{ path: 'customerId', select: 'name avatar' }],
  });
}

module.exports = { createReview, updateReview, listByStore, listByFood };
