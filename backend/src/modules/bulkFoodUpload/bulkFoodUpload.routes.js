const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const service = require('./bulkFoodUpload.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadSpreadsheet } = require('../../middleware/upload.middleware');

/**
 * Tag: Bulk Upload
 */

const bulkUpload = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A CSV or Excel file is required');
  if (!req.body.storeId) throw ApiError.badRequest('storeId is required');

  const result = await service.bulkUploadFoods(req.body.storeId, req.user._id, req.file);
  ApiResponse.success(res, {
    statusCode: 201,
    message: `Bulk upload completed: ${result.successCount} succeeded, ${result.failedCount} failed`,
    data: result,
  });
});

router.post(
  '/',
  authenticate,
  requireRole('SHOP_OWNER'),
  uploadSpreadsheet.single('file'),
  bulkUpload
);

module.exports = router;
