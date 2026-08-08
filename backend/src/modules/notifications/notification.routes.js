const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./notification.service');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * Tag: Notifications
 */

const listMine = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMine(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Notifications fetched', data: items, meta });
});

const markAsRead = catchAsync(async (req, res) => {
  const notification = await service.markAsRead(req.user._id, req.params.id);
  ApiResponse.success(res, { message: 'Notification marked as read', data: notification });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await service.markAllAsRead(req.user._id);
  ApiResponse.success(res, { message: 'All notifications marked as read' });
});

router.use(authenticate);
router.get('/', listMine);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;
