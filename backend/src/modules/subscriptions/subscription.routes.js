const router = require('express').Router();
const controller = require('./subscription.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Subscriptions
 */

router.use(authenticate);

// Admin — global default pricing (applies to every store without an override)
router.get('/plans/global', requireRole('SUPER_ADMIN'), controller.listGlobalPlans);
router.post('/plans/global', requireRole('SUPER_ADMIN'), controller.upsertGlobalPlan);

// Admin — per-store custom pricing
router.get('/plans/store/:storeId/overrides', requireRole('SUPER_ADMIN'), controller.listStoreOverrides);
router.post('/plans/store/:storeId/overrides', requireRole('SUPER_ADMIN'), controller.upsertStoreOverride);
router.delete(
  '/plans/store/:storeId/overrides/:billingCycle',
  requireRole('SUPER_ADMIN'),
  controller.removeStoreOverride
);

// Shop owner — see pricing that applies to their store, subscribe/pay, check status
router.get('/store/:storeId/plans', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.getEffectivePlans);
router.post('/store/:storeId/subscribe', requireRole('SHOP_OWNER'), controller.subscribe);
router.get(
  '/store/:storeId/current',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  controller.getCurrentSubscription
);
router.get('/store/:storeId/history', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.getHistory);
router.get('/store/:storeId/status', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.getOwnerStatus);

module.exports = router;
