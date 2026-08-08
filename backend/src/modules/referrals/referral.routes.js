const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./referral.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Referrals
 */

const createCampaign = catchAsync(async (req, res) => {
  const referral = await service.createCampaign(req.user._id, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Referral campaign created', data: referral });
});

const updateCampaign = catchAsync(async (req, res) => {
  const referral = await service.updateCampaign(req.params.id, req.body);
  ApiResponse.success(res, { message: 'Referral campaign updated', data: referral });
});

const listCampaigns = catchAsync(async (req, res) => {
  const { items, meta } = await service.listCampaigns(req.query);
  ApiResponse.success(res, { message: 'Referral campaigns fetched', data: items, meta });
});

// GET /r/:code  — resolves a referral URL (public, used by frontend landing page)
const resolveReferral = catchAsync(async (req, res) => {
  const referral = await service.resolveReferral(req.params.code);
  ApiResponse.success(res, {
    message: 'Referral resolved',
    data: { code: referral.code, customSlug: referral.customSlug, campaignName: referral.campaignName },
  });
});

router.get('/resolve/:code', resolveReferral);

router.use(authenticate, requireRole('SUPER_ADMIN'));
router.post('/', createCampaign);
router.get('/', listCampaigns);
router.patch('/:id', updateCampaign);

module.exports = router;
