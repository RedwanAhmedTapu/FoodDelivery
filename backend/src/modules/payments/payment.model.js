const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    // A payment is either for an Order or for a StoreSubscription — never both.
    purpose: { type: String, enum: ['ORDER', 'SUBSCRIPTION'], default: 'ORDER', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'StoreSubscription', default: null },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: {
      type: String,
      enum: ['COD', 'SSLCOMMERZ', 'BKASH', 'NAGAD', 'STRIPE'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    providerReference: { type: String, default: null }, // gateway transaction id
    // Never store raw card/sensitive payment details here.
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ providerReference: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
