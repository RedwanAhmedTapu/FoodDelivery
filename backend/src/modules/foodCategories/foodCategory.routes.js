const router = require('express').Router();
const controller = require('./foodCategory.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');

/**
 * Tag: Categories
 */

router.get('/', controller.list); // public/admin (paginated)
router.get('/active', controller.listAllActive); // public, unpaginated for dropdowns

router.use(authenticate, requireRole('SUPER_ADMIN'));
router.post('/', controller.create);
router.patch('/reorder', controller.reorder);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/status', controller.setActive);
router.patch('/:id/image', uploadImage.single('image'), controller.uploadImage);

module.exports = router;
