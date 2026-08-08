const Order = require('../orders/order.model');
const Food = require('../foods/food.model');
const Store = require('../stores/store.model');

/**
 * Rule-based recommendation engine.
 *
 * Extendability note: this module intentionally exposes a single
 * `buildCustomerProfile` step separate from the ranking steps, so a future
 * ML-based scorer can replace `rankFoods`/`rankCategories`/`rankStores`
 * while reusing the same profile-building and API surface.
 */

const MIN_ORDERS_FOR_PERSONALIZATION = 2;

async function buildCustomerProfile(customerId) {
  const orders = await Order.find({ customerId, orderStatus: 'DELIVERED' })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const categoryFrequency = new Map();
  const foodFrequency = new Map();
  const storeFrequency = new Map();
  let totalSpend = 0;

  orders.forEach((order) => {
    storeFrequency.set(order.storeId.toString(), (storeFrequency.get(order.storeId.toString()) || 0) + 1);
    totalSpend += order.subtotal;
    order.items.forEach((item) => {
      foodFrequency.set(item.foodId.toString(), (foodFrequency.get(item.foodId.toString()) || 0) + item.quantity);
    });
  });

  return { orders, categoryFrequency, foodFrequency, storeFrequency, totalSpend };
}

async function enrichCategoryFrequencyFromFoods(foodFrequency) {
  const foodIds = [...foodFrequency.keys()];
  if (!foodIds.length) return new Map();

  const foods = await Food.find({ _id: { $in: foodIds } }).select('categoryId').lean();
  const categoryFrequency = new Map();
  foods.forEach((food) => {
    const catId = food.categoryId.toString();
    const qty = foodFrequency.get(food._id.toString()) || 0;
    categoryFrequency.set(catId, (categoryFrequency.get(catId) || 0) + qty);
  });
  return categoryFrequency;
}

async function recommendFoods(customerId, limit = 10) {
  const profile = await buildCustomerProfile(customerId);

  if (profile.orders.length < MIN_ORDERS_FOR_PERSONALIZATION) {
    // Fallback: recommend popular/featured foods platform-wide
    return Food.find({ isActive: true, availability: true })
      .sort({ totalOrders: -1, rating: -1 })
      .limit(limit)
      .populate('categoryId storeId')
      .lean();
  }

  const categoryFrequency = await enrichCategoryFrequencyFromFoods(profile.foodFrequency);
  const topCategoryIds = [...categoryFrequency.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const purchasedFoodIds = [...profile.foodFrequency.keys()];

  // Prioritize similar foods in favorite categories, excluding already-frequently-purchased items,
  // then top up with recently purchased favorites the customer may want to reorder.
  const candidates = await Food.find({
    isActive: true,
    availability: true,
    categoryId: { $in: topCategoryIds },
    _id: { $nin: purchasedFoodIds },
  })
    .sort({ rating: -1, totalOrders: -1 })
    .limit(limit)
    .populate('categoryId storeId')
    .lean();

  if (candidates.length < limit) {
    const reorderFavorites = await Food.find({ _id: { $in: purchasedFoodIds }, isActive: true, availability: true })
      .limit(limit - candidates.length)
      .populate('categoryId storeId')
      .lean();
    return [...candidates, ...reorderFavorites];
  }

  return candidates;
}

async function recommendCategories(customerId, limit = 6) {
  const FoodCategory = require('../foodCategories/foodCategory.model');
  const profile = await buildCustomerProfile(customerId);

  if (profile.orders.length < MIN_ORDERS_FOR_PERSONALIZATION) {
    return FoodCategory.find({ isActive: true }).sort({ sortOrder: 1 }).limit(limit).lean();
  }

  const categoryFrequency = await enrichCategoryFrequencyFromFoods(profile.foodFrequency);
  const topCategoryIds = [...categoryFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return FoodCategory.find({ _id: { $in: topCategoryIds }, isActive: true }).lean();
}

async function recommendStores(customerId, limit = 6) {
  const profile = await buildCustomerProfile(customerId);

  if (profile.orders.length < MIN_ORDERS_FOR_PERSONALIZATION) {
    return Store.find({ isActive: true, approvalStatus: 'APPROVED' })
      .sort({ rating: -1, totalOrders: -1 })
      .limit(limit)
      .lean();
  }

  const favoriteStoreIds = [...profile.storeFrequency.keys()];
  const favorites = await Store.find({ _id: { $in: favoriteStoreIds }, isActive: true }).lean();

  if (favorites.length < limit) {
    const additional = await Store.find({
      isActive: true,
      approvalStatus: 'APPROVED',
      _id: { $nin: favoriteStoreIds },
    })
      .sort({ rating: -1 })
      .limit(limit - favorites.length)
      .lean();
    return [...favorites, ...additional];
  }

  return favorites;
}

module.exports = { buildCustomerProfile, recommendFoods, recommendCategories, recommendStores };
