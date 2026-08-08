const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./foodCategory.service');

const create = catchAsync(async (req, res) => {
  const category = await service.create(req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Category created', data: category });
});

const update = catchAsync(async (req, res) => {
  const category = await service.update(req.params.id, req.body);
  ApiResponse.success(res, { message: 'Category updated', data: category });
});

const remove = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  ApiResponse.success(res, { message: 'Category deleted' });
});

const setActive = catchAsync(async (req, res) => {
  const category = await service.setActive(req.params.id, req.body.isActive);
  ApiResponse.success(res, { message: 'Category status updated', data: category });
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await service.list(req.query);
  ApiResponse.success(res, { message: 'Categories fetched', data: items, meta });
});

const listAllActive = catchAsync(async (req, res) => {
  const categories = await service.listAllActive();
  ApiResponse.success(res, { message: 'Categories fetched', data: categories });
});

const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const category = await service.uploadCategoryImage(req.params.id, dataUri);
  ApiResponse.success(res, { message: 'Image uploaded', data: category });
});

const reorder = catchAsync(async (req, res) => {
  const categories = await service.reorder(req.body.orderedIds);
  ApiResponse.success(res, { message: 'Categories reordered', data: categories });
});

module.exports = { create, update, remove, setActive, list, listAllActive, uploadImage, reorder };
