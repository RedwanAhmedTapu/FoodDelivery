const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./food.service');

const createFood = catchAsync(async (req, res) => {
  const food = await service.createFood(req.user._id, req.user.role, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Food created successfully', data: food });
});

const getFood = catchAsync(async (req, res) => {
  const food = await service.getFoodById(req.params.id);
  ApiResponse.success(res, { message: 'Food fetched', data: food });
});

const updateFood = catchAsync(async (req, res) => {
  const food = await service.updateFood(req.params.id, req.user._id, req.user.role, req.body);
  ApiResponse.success(res, { message: 'Food updated successfully', data: food });
});

const deleteFood = catchAsync(async (req, res) => {
  await service.deleteFood(req.params.id, req.user._id, req.user.role);
  ApiResponse.success(res, { message: 'Food deleted successfully' });
});

const setActive = catchAsync(async (req, res) => {
  const food = await service.setActive(req.params.id, req.user._id, req.user.role, req.body.isActive);
  ApiResponse.success(res, { message: 'Food status updated', data: food });
});

const listByStore = catchAsync(async (req, res) => {
  const { items, meta } = await service.listByStore(req.params.storeId, req.query);
  ApiResponse.success(res, { message: 'Foods fetched', data: items, meta });
});

const searchFoods = catchAsync(async (req, res) => {
  const { items, meta } = await service.searchFoods(req.query);
  ApiResponse.success(res, { message: 'Foods fetched', data: items, meta });
});

const uploadImages = catchAsync(async (req, res) => {
  if (!req.files || !req.files.length) {
    return ApiResponse.error(res, { statusCode: 400, message: 'At least one image is required' });
  }
  const food = await service.uploadFoodImages(req.params.id, req.user._id, req.user.role, req.files);
  ApiResponse.success(res, { message: 'Images uploaded', data: food });
});

module.exports = { createFood, getFood, updateFood, deleteFood, setActive, listByStore, searchFoods, uploadImages };
