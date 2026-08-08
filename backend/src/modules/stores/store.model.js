const mongoose = require('mongoose');
const { Schema } = mongoose;

const storeSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    logo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    coverImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    openingTime: { type: String, default: '09:00' }, // HH:mm
    closingTime: { type: String, default: '23:00' },
    deliveryRadius: { type: Number, default: 5 }, // km
    minimumOrder: { type: Number, default: 0 },
    estimatedDeliveryTime: { type: Number, default: 30 }, // minutes
    isActive: { type: Boolean, default: false },
    // Why the store is currently not live to customers, shown to the owner.
    // 'NONE' when isActive is true. Set automatically by the subscription
    // expiry sweep or store approval flow; 'OWNER_DEACTIVATED' when the
    // owner manually turned it off via the activate/deactivate toggle.
    deactivationReason: {
      type: String,
      enum: ['NONE', 'OWNER_DEACTIVATED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_REQUIRED', 'ADMIN_SUSPENDED', 'PENDING_APPROVAL', 'REJECTED'],
      default: 'PENDING_APPROVAL',
    },
    subscriptionStatus: {
      type: String,
      enum: ['NONE', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED'],
      default: 'NONE',
    },
    currentSubscriptionId: { type: Schema.Types.ObjectId, ref: 'StoreSubscription', default: null },
    subscriptionExpiresAt: { type: Date, default: null },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String, default: null },
    theme: {
      primaryColor: { type: String, default: '#FF5A1F' },
      secondaryColor: { type: String, default: '#1F2937' },
    },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ ownerId: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ name: 'text' });

module.exports = mongoose.model('Store', storeSchema);
