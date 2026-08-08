const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./review.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Reviews
 */

const createReview = catchAsync(async (req, res) => {
  const review = await service.createReview(req.user._id, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Review submitted', data: review });
});

const updateReview = catchAsync(async (req, res) => {
  const review = await service.updateReview(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, { message: 'Review updated', data: review });
});

const listByStore = catchAsync(async (req, res) => {
  const { items, meta } = await service.listByStore(req.params.storeId, req.query);
  ApiResponse.success(res, { message: 'Reviews fetched', data: items, meta });
});

const listByFood = catchAsync(async (req, res) => {
  const { items, meta } = await service.listByFood(req.params.foodId, req.query);
  ApiResponse.success(res, { message: 'Reviews fetched', data: items, meta });
});

router.get('/store/:storeId', listByStore);
router.get('/food/:foodId', listByFood);

router.use(authenticate, requireRole('CUSTOMER'));
router.post('/', createReview);
router.patch('/:id', updateReview);

module.exports = router;
