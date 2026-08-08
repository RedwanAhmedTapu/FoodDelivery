const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./subscription.service');

// Admin — global pricing
const upsertGlobalPlan = catchAsync(async (req, res) => {
  const { billingCycle, price, label } = req.body;
  const plan = await service.upsertGlobalPlan(billingCycle, price, label);
  ApiResponse.success(res, { message: 'Global plan updated', data: plan });
});

const listGlobalPlans = catchAsync(async (req, res) => {
  const plans = await service.listGlobalPlans();
  ApiResponse.success(res, { message: 'Global plans fetched', data: plans });
});

// Admin — per-store overrides
const upsertStoreOverride = catchAsync(async (req, res) => {
  const { billingCycle, price, label } = req.body;
  const plan = await service.upsertStoreOverride(req.params.storeId, billingCycle, price, label);
  ApiResponse.success(res, { message: 'Store-specific price updated', data: plan });
});

const removeStoreOverride = catchAsync(async (req, res) => {
  await service.removeStoreOverride(req.params.storeId, req.params.billingCycle);
  ApiResponse.success(res, { message: 'Store-specific price removed' });
});

const listStoreOverrides = catchAsync(async (req, res) => {
  const plans = await service.listStoreOverrides(req.params.storeId);
  ApiResponse.success(res, { message: 'Store overrides fetched', data: plans });
});

// Shop owner — pricing they see + subscribe/pay
const getEffectivePlans = catchAsync(async (req, res) => {
  const plans = await service.getEffectivePlansForStore(req.params.storeId);
  ApiResponse.success(res, { message: 'Pricing fetched', data: plans });
});

const subscribe = catchAsync(async (req, res) => {
  const { billingCycle, provider } = req.body;
  const result = await service.subscribe(req.params.storeId, req.user._id, req.user.role, billingCycle, provider);
  ApiResponse.success(res, { statusCode: 201, message: 'Subscription payment initiated', data: result });
});

const getCurrentSubscription = catchAsync(async (req, res) => {
  const subscription = await service.getCurrentSubscription(req.params.storeId);
  ApiResponse.success(res, { message: 'Current subscription fetched', data: subscription });
});

const getHistory = catchAsync(async (req, res) => {
  const history = await service.getHistory(req.params.storeId);
  ApiResponse.success(res, { message: 'Subscription history fetched', data: history });
});

const getOwnerStatus = catchAsync(async (req, res) => {
  const status = await service.getOwnerFacingStatus(req.params.storeId, req.user._id, req.user.role);
  ApiResponse.success(res, { message: 'Store status fetched', data: status });
});

module.exports = {
  upsertGlobalPlan,
  listGlobalPlans,
  upsertStoreOverride,
  removeStoreOverride,
  listStoreOverrides,
  getEffectivePlans,
  subscribe,
  getCurrentSubscription,
  getHistory,
  getOwnerStatus,
};
