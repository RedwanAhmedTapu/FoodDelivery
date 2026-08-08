const Referral = require('./referral.model');
const ReferralUsage = require('./referralUsage.model');
const ApiError = require('../../utils/ApiError');
const runTransaction = require('../../utils/runTransaction');
const { generateUniqueReferralCode } = require('../../utils/generateReferralCode');
const { slugify } = require('../../utils/generateSlug');
const { getPagination, paginate } = require('../../utils/pagination');
const pointService = require('../points/point.service');

async function createCampaign(createdBy, payload) {
  const code = await generateUniqueReferralCode(Referral);
  const customSlug = payload.customSlug ? slugify(payload.customSlug) : null;

  if (customSlug) {
    const exists = await Referral.exists({ customSlug });
    if (exists) throw ApiError.conflict('Custom slug already in use');
  }

  return Referral.create({
    code,
    customSlug,
    campaignName: payload.campaignName,
    createdBy,
    rewardPoints: payload.rewardPoints,
    maxUsage: payload.maxUsage,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
}

async function updateCampaign(id, updates) {
  const allowed = ['campaignName', 'rewardPoints', 'maxUsage', 'startDate', 'endDate', 'isActive'];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });
  const referral = await Referral.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!referral) throw ApiError.notFound('Referral campaign not found');
  return referral;
}

async function listCampaigns(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return paginate(Referral, filter, pagination);
}

async function resolveReferral(codeOrSlug) {
  const referral = await Referral.findOne({
    $or: [{ code: codeOrSlug.toUpperCase() }, { customSlug: codeOrSlug.toLowerCase() }],
  });
  if (!referral) throw ApiError.notFound('Referral link not found');
  return referral;
}

/**
 * Award referral points once a referred customer completes their first
 * qualifying order. Prevents self-referral and duplicate rewards via the
 * unique (referralId, referredUserId) index and rewardIssued flag.
 */
async function rewardQualifyingOrder(referredUserId, referralId, orderId) {
  if (!referralId) return null;

  const referral = await Referral.findById(referralId);
  if (!referral || !referral.isActive) return null;

  // Prevent self-referral: creator cannot be rewarded for referring themself
  if (referral.createdBy.toString() === referredUserId.toString()) return null;

  const usage = await runTransaction(async (session) => {
    const sessionOpt = session ? { session } : {};
    const findQuery = ReferralUsage.findOne({ referralId, referredUserId });
    let record = session ? await findQuery.session(session) : await findQuery;

    if (!record) {
      [record] = await ReferralUsage.create(
        [{ referralId, referredUserId, qualifyingOrderId: orderId }],
        sessionOpt
      );
    }

    if (record.rewardIssued) {
      return null; // already rewarded — no duplicate
    }

    await pointService.applyPointTransaction(
      {
        userId: referredUserId,
        type: 'REFERRAL_BONUS',
        points: referral.rewardPoints,
        referenceType: 'Referral',
        referenceId: referral._id,
        description: `Referral bonus: ${referral.campaignName}`,
      },
      session
    );

    record.rewardIssued = true;
    record.rewardPoints = referral.rewardPoints;
    record.qualifyingOrderId = orderId;
    await record.save(sessionOpt);

    return record;
  });

  return usage;
}

module.exports = {
  createCampaign,
  updateCampaign,
  listCampaigns,
  resolveReferral,
  rewardQualifyingOrder,
};
