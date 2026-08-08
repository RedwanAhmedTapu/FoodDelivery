const mongoose = require('mongoose');
const { Schema } = mongoose;

const referralSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    customSlug: { type: String, unique: true, sparse: true, lowercase: true },
    campaignName: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rewardPoints: { type: Number, default: 50 },
    maxUsage: { type: Number, default: null }, // null = unlimited
    usageCount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


module.exports = mongoose.model('Referral', referralSchema);
