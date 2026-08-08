const router = require('express').Router();
const controller = require('./storeCustomization.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');

/**
 * Tag: Store Customization
 */

router.get('/:storeId', controller.getCustomization); // public preview

router.use(authenticate);
router.patch('/:storeId', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.updateCustomization);
router.patch(
  '/:storeId/banner',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  uploadImage.single('banner'),
  controller.uploadBanner
);

module.exports = router;
