const router = require('express').Router();
const controller = require('./deliveryBoy.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');

/**
 * Tag: Delivery
 */

router.use(authenticate);

// Delivery boy self-service
router.get('/me', requireRole('DELIVERY_BOY'), controller.getMyProfile);
router.patch('/me', requireRole('DELIVERY_BOY'), controller.updateMyProfile);
router.patch(
  '/me/profile-image',
  requireRole('DELIVERY_BOY'),
  uploadImage.single('image'),
  controller.uploadProfileImage
);
router.patch('/me/status', requireRole('DELIVERY_BOY'), controller.setOnlineStatus);
router.post('/location', requireRole('DELIVERY_BOY'), controller.updateLocation);
router.get('/orders', requireRole('DELIVERY_BOY'), controller.getMyAssignedOrders);
router.patch('/orders/:orderId/accept', requireRole('DELIVERY_BOY'), controller.acceptDelivery);
router.patch('/orders/:orderId/complete', requireRole('DELIVERY_BOY'), controller.completeDelivery);

// Admin management
router.get('/', requireRole('SUPER_ADMIN'), controller.listAll);
router.patch('/:id/approval', requireRole('SUPER_ADMIN'), controller.setApprovalStatus);
router.post(
  '/orders/:orderId/assign',
  requireRole('SUPER_ADMIN', 'SHOP_OWNER'),
  controller.assignManually
);
router.post(
  '/orders/:orderId/assign-auto',
  requireRole('SUPER_ADMIN', 'SHOP_OWNER'),
  controller.assignAutomatically
);

module.exports = router;
