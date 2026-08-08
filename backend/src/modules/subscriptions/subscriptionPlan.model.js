const mongoose = require('mongoose');
const { Schema } = mongoose;

const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'];

const CYCLE_DAYS = {
  MONTHLY: 30,
  QUARTERLY: 90,
  HALF_YEARLY: 182,
  YEARLY: 365,
};

/**
 * A plan is either:
 *  - a GLOBAL default for a billing cycle (storeId: null) — applies to every
 *    store that hasn't been given a custom override, or
 *  - a STORE-specific override (storeId: <id>) — admin can charge a
 *    particular store owner a different price for the same billing cycle.
 *
 * Exactly one GLOBAL plan should exist per billing cycle at a time; the
 * service layer enforces this via upsert rather than a unique index, since
 * "one active plan per (billingCycle, storeId||null)" is awkward to express
 * as a plain unique index when storeId is sometimes null.
 */
const subscriptionPlanSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    billingCycle: { type: String, enum: BILLING_CYCLES, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    isActive: { type: Boolean, default: true },
    label: { type: String, default: null }, // optional admin-facing note, e.g. "Launch discount"
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ storeId: 1, billingCycle: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
module.exports.BILLING_CYCLES = BILLING_CYCLES;
module.exports.CYCLE_DAYS = CYCLE_DAYS;
