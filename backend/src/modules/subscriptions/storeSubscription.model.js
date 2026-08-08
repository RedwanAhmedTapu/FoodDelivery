const mongoose = require('mongoose');
const { Schema } = mongoose;

const SUBSCRIPTION_STATUSES = ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

const storeSubscriptionSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
      required: true,
    },
    price: { type: Number, required: true }, // snapshot of the plan price at purchase time
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'PENDING_PAYMENT' },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    lastPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  },
  { timestamps: true }
);

storeSubscriptionSchema.index({ storeId: 1, createdAt: -1 });
storeSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

module.exports = mongoose.model('StoreSubscription', storeSubscriptionSchema);
module.exports.SUBSCRIPTION_STATUSES = SUBSCRIPTION_STATUSES;
