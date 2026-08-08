const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * One row per rider offered a specific order. A dispatch round for an order
 * creates one PENDING row for the top-ranked candidate; on REJECTED/TIMEOUT
 * the next-ranked candidate gets their own PENDING row (previous riders are
 * never re-offered the same order). ACCEPTED stops the cascade.
 */
const dispatchAttemptSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    deliveryBoyId: { type: Schema.Types.ObjectId, ref: 'DeliveryBoy', required: true },
    rank: { type: Number, required: true }, // position in the scored candidate list for this round
    score: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'TIMEOUT'], default: 'PENDING' },
    notifiedAt: { type: Date, default: Date.now },
    respondBy: { type: Date, required: true }, // notifiedAt + offer window (default 20s)
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dispatchAttemptSchema.index({ orderId: 1, deliveryBoyId: 1 });
dispatchAttemptSchema.index({ status: 1, respondBy: 1 }); // for the cron timeout sweep

module.exports = mongoose.model('DispatchAttempt', dispatchAttemptSchema);
