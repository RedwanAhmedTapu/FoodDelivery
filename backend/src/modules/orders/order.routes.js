const router = require('express').Router();
const controller = require('./order.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validation.middleware');
const { createOrderSchema, updateStatusSchema, cancelOrderSchema, verifyDeliverySchema } = require('./order.validation');

/**
 * Tag: Orders
 */

router.use(authenticate);

router.post('/', requireRole('CUSTOMER'), validate({ body: createOrderSchema }), controller.createOrder);
router.get('/mine', requireRole('CUSTOMER'), controller.listMyOrders);
router.get('/store/mine', requireRole('SHOP_OWNER'), controller.listStoreOrders);
router.get('/admin/all', requireRole('SUPER_ADMIN'), controller.listAllOrders);

router.get('/:id', controller.getOrder);
router.patch(
  '/:id/status',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN', 'DELIVERY_BOY'),
  validate({ body: updateStatusSchema }),
  controller.updateStatus
);
router.patch(
  '/:id/cancel',
  requireRole('CUSTOMER', 'SHOP_OWNER', 'SUPER_ADMIN'),
  validate({ body: cancelOrderSchema }),
  controller.cancelOrder
);
router.patch(
  '/:id/verify-delivery',
  requireRole('DELIVERY_BOY'),
  validate({ body: verifyDeliverySchema }),
  controller.verifyDelivery
);

module.exports = router;
