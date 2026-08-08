const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./point.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Points
 */

const getMyBalance = catchAsync(async (req, res) => {
  const balance = await service.getBalance(req.user._id);
  ApiResponse.success(res, { message: 'Points balance fetched', data: { balance } });
});

const getMyHistory = catchAsync(async (req, res) => {
  const { items, meta } = await service.getHistory(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Points history fetched', data: items, meta });
});

const adminAdjust = catchAsync(async (req, res) => {
  const { userId, points, description } = req.body;
  const txn = await service.adminAdjustPoints(userId, points, description);
  ApiResponse.success(res, { message: 'Points adjusted', data: txn });
});

router.use(authenticate);
router.get('/me/balance', requireRole('CUSTOMER'), getMyBalance);
router.get('/me/history', requireRole('CUSTOMER'), getMyHistory);
router.post('/admin/adjust', requireRole('SUPER_ADMIN'), adminAdjust);

module.exports = router;
