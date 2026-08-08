const router = require('express').Router();
const controller = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');

/**
 * Tag: Users
 */

router.use(authenticate);

router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.patch('/me/avatar', uploadImage.single('avatar'), controller.updateMyAvatar);

// Admin-only user management
router.get('/', requireRole('SUPER_ADMIN'), controller.listUsers);
router.get('/:id', requireRole('SUPER_ADMIN'), controller.getUserById);
router.patch('/:id/status', requireRole('SUPER_ADMIN'), controller.setActiveStatus);

module.exports = router;
