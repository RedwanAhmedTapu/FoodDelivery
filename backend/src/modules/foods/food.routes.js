const router = require('express').Router();
const controller = require('./food.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validation.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');
const { createFoodSchema, updateFoodSchema, searchQuerySchema } = require('./food.validation');

/**
 * Tag: Foods
 */

router.get('/', validate({ query: searchQuerySchema }), controller.searchFoods);
router.get('/store/:storeId', controller.listByStore);
router.get('/:id', controller.getFood);

router.use(authenticate);
router.post('/', requireRole('SHOP_OWNER'), validate({ body: createFoodSchema }), controller.createFood);
router.patch(
  '/:id',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  validate({ body: updateFoodSchema }),
  controller.updateFood
);
router.delete('/:id', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.deleteFood);
router.patch('/:id/status', requireRole('SHOP_OWNER', 'SUPER_ADMIN'), controller.setActive);
router.patch(
  '/:id/images',
  requireRole('SHOP_OWNER', 'SUPER_ADMIN'),
  uploadImage.array('images', 5),
  controller.uploadImages
);

module.exports = router;
