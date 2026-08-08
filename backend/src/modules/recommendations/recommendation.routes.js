const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./recommendation.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Recommendations
 */

const getFoods = catchAsync(async (req, res) => {
  const foods = await service.recommendFoods(req.user._id, Number(req.query.limit) || 10);
  ApiResponse.success(res, { message: 'Recommended foods fetched', data: foods });
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await service.recommendCategories(req.user._id, Number(req.query.limit) || 6);
  ApiResponse.success(res, { message: 'Recommended categories fetched', data: categories });
});

const getStores = catchAsync(async (req, res) => {
  const stores = await service.recommendStores(req.user._id, Number(req.query.limit) || 6);
  ApiResponse.success(res, { message: 'Recommended stores fetched', data: stores });
});

router.use(authenticate, requireRole('CUSTOMER'));
router.get('/foods', getFoods);
router.get('/categories', getCategories);
router.get('/stores', getStores);

module.exports = router;
