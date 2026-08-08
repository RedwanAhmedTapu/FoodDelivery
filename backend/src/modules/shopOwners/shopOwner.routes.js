const router = require('express').Router();
const controller = require('./shopOwner.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');

/**
 * Tag: Shop Owners
 */

router.use(authenticate);

router.get('/me', requireRole('SHOP_OWNER'), controller.getMyProfile);
router.patch('/me', requireRole('SHOP_OWNER'), controller.updateMyProfile);
router.patch(
  '/me/profile-image',
  requireRole('SHOP_OWNER'),
  uploadImage.single('image'),
  controller.uploadProfileImage
);
router.post(
  '/me/documents',
  requireRole('SHOP_OWNER'),
  uploadImage.single('document'),
  controller.uploadDocument
);

// SUPER_ADMIN management
router.get('/', requireRole('SUPER_ADMIN'), controller.listShopOwners);
router.patch('/:id/approval', requireRole('SUPER_ADMIN'), controller.setApprovalStatus);
router.patch('/:id/status', requireRole('SUPER_ADMIN'), controller.setStatus);

module.exports = router;
