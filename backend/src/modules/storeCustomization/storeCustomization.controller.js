const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./storeCustomization.service');

const getCustomization = catchAsync(async (req, res) => {
  const customization = await service.getByStoreId(req.params.storeId);
  ApiResponse.success(res, { message: 'Store customization fetched', data: customization });
});

const updateCustomization = catchAsync(async (req, res) => {
  const customization = await service.update(req.params.storeId, req.user._id, req.user.role, req.body);
  ApiResponse.success(res, { message: 'Store customization updated', data: customization });
});

const uploadBanner = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const customization = await service.uploadBanner(req.params.storeId, req.user._id, req.user.role, dataUri);
  ApiResponse.success(res, { message: 'Banner uploaded', data: customization });
});

module.exports = { getCustomization, updateCustomization, uploadBanner };
