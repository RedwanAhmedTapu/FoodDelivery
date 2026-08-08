const mongoose = require('mongoose');
const { Schema } = mongoose;

const deliveryBoySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    profileImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    vehicleType: { type: String, enum: ['BIKE', 'BICYCLE', 'CAR', 'ON_FOOT'], default: 'BIKE' },
    vehicleNumber: { type: String, default: null },
    licenseInformation: { type: String, default: null },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false }, // online AND not currently on a delivery
    status: { type: String, enum: ['PENDING', 'APPROVED', 'SUSPENDED'], default: 'PENDING' },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    // --- Dispatch scoring inputs ---
    rating: { type: Number, default: 5, min: 0, max: 5 }, // avg of DELIVERY-type reviews
    totalRatings: { type: Number, default: 0 },
    totalDispatchOffers: { type: Number, default: 0 }, // how many offers this rider has been sent
    totalDispatchAccepts: { type: Number, default: 0 },
    // idleSince: when the rider last became available (isOnline && isAvailable).
    // Used to score "who's been waiting longest" as a tie-breaker/fairness factor.
    idleSince: { type: Date, default: null },
    // Basic, transparent fraud signal — NOT machine-learned. Incremented by
    // the dispatch/report flows (e.g. repeated no-shows, customer reports),
    // and can be manually adjusted by admin. Riders above the threshold in
    // env FRAUD_SCORE_BLOCK_THRESHOLD are excluded from dispatch candidates.
    fraudScore: { type: Number, default: 0, min: 0 },
    consecutiveMissedOffers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

deliveryBoySchema.index({ currentLocation: '2dsphere' });
deliveryBoySchema.index({ isOnline: 1, isAvailable: 1 });

deliveryBoySchema.virtual('acceptanceRate').get(function acceptanceRate() {
  if (!this.totalDispatchOffers) return 1; // no history yet — treat as neutral/good
  return Math.round((this.totalDispatchAccepts / this.totalDispatchOffers) * 100) / 100;
});
deliveryBoySchema.set('toJSON', { virtuals: true });
deliveryBoySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DeliveryBoy', deliveryBoySchema);
