const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./report.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadImage } = require('../../middleware/upload.middleware');

/**
 * Tag: Reports
 */

const createReport = catchAsync(async (req, res) => {
  const report = await service.createReport(req.user._id, req.body, req.files || []);
  ApiResponse.success(res, { statusCode: 201, message: 'Order reported successfully', data: report });
});

const updateStatus = catchAsync(async (req, res) => {
  const report = await service.updateStatus(req.params.id, req.body.status, req.body.adminResponse);
  ApiResponse.success(res, { message: 'Report status updated', data: report });
});

const listMyReports = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMyReports(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Reports fetched', data: items, meta });
});

const listAll = catchAsync(async (req, res) => {
  const { items, meta } = await service.listAll(req.query);
  ApiResponse.success(res, { message: 'Reports fetched', data: items, meta });
});

router.use(authenticate);
router.post('/', requireRole('CUSTOMER'), uploadImage.array('images', 5), createReport);
router.get('/mine', requireRole('CUSTOMER'), listMyReports);
router.get('/admin/all', requireRole('SUPER_ADMIN'), listAll);
router.patch('/:id/status', requireRole('SUPER_ADMIN'), updateStatus);

module.exports = router;
