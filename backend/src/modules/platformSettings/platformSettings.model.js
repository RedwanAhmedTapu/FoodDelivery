const mongoose = require('mongoose');
const { Schema } = mongoose;

const platformSettingsSchema = new Schema(
  {
    // Singleton key to guarantee only one settings document exists
    key: { type: String, default: 'GLOBAL', unique: true },

    platformFee: {
      type: { type: String, enum: ['FIXED', 'PERCENTAGE'], default: 'PERCENTAGE' },
      value: { type: Number, default: 5 }, // 5% or fixed amount
      minOrderAmount: { type: Number, default: 0 },
      maxFeeAmount: { type: Number, default: null }, // cap, null = no cap
    },

    pointsRules: {
      earnRatePer100: { type: Number, default: 5 }, // points earned per 100 currency spent
      redeemPointsPerUnit: { type: Number, default: 100 }, // points required
      redeemValuePerUnit: { type: Number, default: 10 }, // currency value for redeemPointsPerUnit
      maxRedeemPercentOfOrder: { type: Number, default: 50 }, // cap redemption at % of subtotal
    },

    deliveryFee: {
      baseFee: { type: Number, default: 30 },
      perKmFee: { type: Number, default: 5 },
    },

    taxPercentage: { type: Number, default: 0 },

    referral: {
      defaultRewardPoints: { type: Number, default: 50 },
    },
  },
  { timestamps: true }
);

async function getSettings() {
  const PlatformSettings = mongoose.model('PlatformSettings');
  let settings = await PlatformSettings.findOne({ key: 'GLOBAL' });
  if (!settings) settings = await PlatformSettings.create({ key: 'GLOBAL' });
  return settings;
}

platformSettingsSchema.statics.getSettings = getSettings;

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
