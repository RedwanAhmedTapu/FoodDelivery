const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./analytics.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Admin
 */

const getAdminDashboard = catchAsync(async (req, res) => {
  const dashboard = await service.getAdminDashboard();
  ApiResponse.success(res, { message: 'Admin dashboard fetched', data: dashboard });
});

const getOrdersTrend = catchAsync(async (req, res) => {
  const trend = await service.getOrdersTrend(req.query.range);
  ApiResponse.success(res, { message: 'Orders trend fetched', data: trend });
});

const getTopStores = catchAsync(async (req, res) => {
  const data = await service.getTopStores(Number(req.query.limit) || 10);
  ApiResponse.success(res, { message: 'Top stores fetched', data });
});

const getTopFoods = catchAsync(async (req, res) => {
  const data = await service.getTopFoods(Number(req.query.limit) || 10);
  ApiResponse.success(res, { message: 'Top foods fetched', data });
});

const getTopCategories = catchAsync(async (req, res) => {
  const data = await service.getTopCategories(Number(req.query.limit) || 10);
  ApiResponse.success(res, { message: 'Top categories fetched', data });
});

const getTopCustomers = catchAsync(async (req, res) => {
  const data = await service.getTopCustomers(Number(req.query.limit) || 10);
  ApiResponse.success(res, { message: 'Top customers fetched', data });
});

const getShopOwnerDashboard = catchAsync(async (req, res) => {
  const dashboard = await service.getShopOwnerDashboard(req.user._id);
  ApiResponse.success(res, { message: 'Shop owner dashboard fetched', data: dashboard });
});

router.use(authenticate);

router.get('/analytics', requireRole('SUPER_ADMIN'), getAdminDashboard);
router.get('/analytics/orders-trend', requireRole('SUPER_ADMIN'), getOrdersTrend);
router.get('/analytics/top-stores', requireRole('SUPER_ADMIN'), getTopStores);
router.get('/analytics/top-foods', requireRole('SUPER_ADMIN'), getTopFoods);
router.get('/analytics/top-categories', requireRole('SUPER_ADMIN'), getTopCategories);
router.get('/analytics/top-customers', requireRole('SUPER_ADMIN'), getTopCustomers);

router.get('/dashboard/shop-owner', requireRole('SHOP_OWNER'), getShopOwnerDashboard);

module.exports = router;
