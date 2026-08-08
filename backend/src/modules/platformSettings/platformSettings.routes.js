const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./platformSettings.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Platform Settings
 */

const getSettings = catchAsync(async (req, res) => {
  const settings = await service.getSettings();
  ApiResponse.success(res, { message: 'Platform settings fetched', data: settings });
});

const updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  ApiResponse.success(res, { message: 'Platform settings updated', data: settings });
});

router.get('/', getSettings); // public - needed by clients to display fee/point rules
router.patch('/', authenticate, requireRole('SUPER_ADMIN'), updateSettings);

module.exports = router;
