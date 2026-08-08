const router = require('express').Router();
const controller = require('./store.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validation.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');
const { createStoreSchema, updateStoreSchema, nearbyQuerySchema } = require('./store.validation');

/**
 * Tag: Stores
 */

// Public / customer browsing
router.get('/', optionalAuth, controller.listActiveStores);
router.get('/nearby', validate({ query: nearbyQuerySchema }), controller.findNearbyStores);
router.get('/slug/:slug', controller.getStoreBySlug);
router.get('/:id', controller.getStore);

// Shop owner management
router.use(authenticate);

router.post('/', requireRole('SHOP_OWNER'), validate({ body: createStoreSchema }), controller.createStore);
router.get('/owner/mine', requireRole('SHOP_OWNER'), controller.getMyStores);
router.patch(
  '/:id',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  validate({ body: updateStoreSchema }),
  controller.updateStore
);
router.delete('/:id', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.deleteStore);
router.patch('/:id/activate', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.activateStore);
router.patch('/:id/deactivate', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.deactivateStore);
router.patch(
  '/:id/logo',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  uploadImage.single('logo'),
  controller.uploadLogo
);
router.patch(
  '/:id/cover',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  uploadImage.single('cover'),
  controller.uploadCoverImage
);

// Admin approval
router.patch('/:id/approval', requireRole('SUPER_ADMIN'), controller.setApprovalStatus);
router.get('/admin/all', requireRole('SUPER_ADMIN'), controller.listAllForAdmin);

module.exports = router;
