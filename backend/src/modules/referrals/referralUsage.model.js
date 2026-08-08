const mongoose = require('mongoose');
const { Schema } = mongoose;

const referralUsageSchema = new Schema(
  {
    referralId: { type: Schema.Types.ObjectId, ref: 'Referral', required: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    qualifyingOrderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    rewardIssued: { type: Boolean, default: false },
    rewardPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// A given user can only be rewarded once per referral (prevents duplicate reward abuse)
referralUsageSchema.index({ referralId: 1, referredUserId: 1 }, { unique: true });

module.exports = mongoose.model('ReferralUsage', referralUsageSchema);
