const User = require('../users/user.model');
const Store = require('../stores/store.model');
const DeliveryBoy = require('../delivery/deliveryBoy.model');
const Order = require('../orders/order.model');
const Report = require('../reports/report.model');
const PointTransaction = require('../points/pointTransaction.model');
const Food = require('../foods/food.model');

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getAdminDashboard() {
  const today = startOfDay();

  const [
    totalUsers,
    totalShopOwners,
    totalStores,
    activeStores,
    totalDeliveryBoys,
    activeDeliveryBoys,
    totalOrders,
    todaysOrders,
    completedOrders,
    cancelledOrders,
    pendingReports,
    revenueAgg,
    pointsEarnedAgg,
    pointsRedeemedAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'CUSTOMER' }),
    User.countDocuments({ role: 'SHOP_OWNER' }),
    Store.countDocuments({}),
    Store.countDocuments({ isActive: true }),
    DeliveryBoy.countDocuments({}),
    DeliveryBoy.countDocuments({ isOnline: true }),
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ orderStatus: 'DELIVERED' }),
    Order.countDocuments({ orderStatus: { $in: ['CANCELLED', 'REJECTED'] } }),
    Report.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
    Order.aggregate([
      { $match: { orderStatus: 'DELIVERED' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, platformFees: { $sum: '$platformFee' } } },
    ]),
    PointTransaction.aggregate([{ $match: { type: 'EARN' } }, { $group: { _id: null, total: { $sum: '$points' } } }]),
    PointTransaction.aggregate([
      { $match: { type: 'REDEEM' } },
      { $group: { _id: null, total: { $sum: { $abs: '$points' } } } },
    ]),
  ]);

  return {
    totalUsers,
    totalShopOwners,
    totalStores,
    activeStores,
    totalDeliveryBoys,
    activeDeliveryBoys,
    totalOrders,
    todaysOrders,
    completedOrders,
    cancelledOrders,
    pendingReports,
    revenue: revenueAgg[0]?.revenue || 0,
    platformFeesCollected: revenueAgg[0]?.platformFees || 0,
    pointsIssued: pointsEarnedAgg[0]?.total || 0,
    pointsRedeemed: pointsRedeemedAgg[0]?.total || 0,
  };
}

async function getOrdersTrend(range = 'daily') {
  const groupFormat = { daily: '%Y-%m-%d', weekly: '%Y-%U', monthly: '%Y-%m' }[range] || '%Y-%m-%d';

  return Order.aggregate([
    { $match: { orderStatus: 'DELIVERED' } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        totalOrders: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function getTopStores(limit = 10) {
  return Store.find({}).sort({ totalOrders: -1 }).limit(limit).select('name totalOrders rating').lean();
}

async function getTopFoods(limit = 10) {
  return Food.find({}).sort({ totalOrders: -1 }).limit(limit).select('name totalOrders rating storeId').lean();
}

async function getTopCategories(limit = 10) {
  return Order.aggregate([
    { $match: { orderStatus: 'DELIVERED' } },
    { $unwind: '$items' },
    {
      $lookup: { from: 'foods', localField: 'items.foodId', foreignField: '_id', as: 'food' },
    },
    { $unwind: '$food' },
    { $group: { _id: '$food.categoryId', totalOrdered: { $sum: '$items.quantity' } } },
    { $sort: { totalOrdered: -1 } },
    { $limit: limit },
    {
      $lookup: { from: 'foodcategories', localField: '_id', foreignField: '_id', as: 'category' },
    },
    { $unwind: '$category' },
    { $project: { _id: 0, category: '$category.name', totalOrdered: 1 } },
  ]);
}

async function getTopCustomers(limit = 10) {
  return User.find({ role: 'CUSTOMER' }).sort({ totalOrders: -1 }).limit(limit).select('name totalOrders pointsBalance').lean();
}

/** Shop owner dashboard, scoped to the owner's own stores only. */
async function getShopOwnerDashboard(ownerId) {
  const today = startOfDay();

  const [
    totalStores,
    activeStores,
    totalOrders,
    todaysOrders,
    pendingOrders,
    cancelledOrders,
    salesAgg,
    lowStockFoods,
  ] = await Promise.all([
    Store.countDocuments({ ownerId }),
    Store.countDocuments({ ownerId, isActive: true }),
    Order.countDocuments({ ownerId }),
    Order.countDocuments({ ownerId, createdAt: { $gte: today } }),
    Order.countDocuments({ ownerId, orderStatus: { $in: ['PENDING', 'ACCEPTED', 'PREPARING'] } }),
    Order.countDocuments({ ownerId, orderStatus: { $in: ['CANCELLED', 'REJECTED'] } }),
    Order.aggregate([
      { $match: { ownerId, orderStatus: 'DELIVERED' } },
      { $group: { _id: '$storeId', totalSales: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Food.find({ ownerId, stock: { $ne: null, $lte: 5 } }).select('name stock storeId').lean(),
  ]);

  const totalSales = salesAgg.reduce((sum, s) => sum + s.totalSales, 0);

  return {
    totalStores,
    activeStores,
    totalOrders,
    todaysOrders,
    pendingOrders,
    cancelledOrders,
    totalSales,
    storeWiseSales: salesAgg,
    lowStockFoods,
  };
}

module.exports = {
  getAdminDashboard,
  getOrdersTrend,
  getTopStores,
  getTopFoods,
  getTopCategories,
  getTopCustomers,
  getShopOwnerDashboard,
};
