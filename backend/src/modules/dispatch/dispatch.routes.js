const router = require('express').Router();
const controller = require('./dispatch.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Dispatch
 */

router.use(authenticate);

router.patch('/offers/:attemptId/accept', requireRole('DELIVERY_BOY'), controller.acceptOffer);
router.patch('/offers/:attemptId/reject', requireRole('DELIVERY_BOY'), controller.rejectOffer);
router.post('/orders/:orderId/retry', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.retryDispatch);
router.post(
  '/orders/:orderId/verify-pickup',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  controller.verifyPickupPin
);

module.exports = router;
