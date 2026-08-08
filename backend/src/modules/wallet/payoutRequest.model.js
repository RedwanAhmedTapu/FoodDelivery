const mongoose = require('mongoose');

const { Schema } = mongoose;

const PAYOUT_METHODS = ['BANK', 'BKASH', 'NAGAD'];
const PAYOUT_STATUSES = ['PENDING', 'PAID', 'REJECTED'];

const payoutRequestSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    ownerType: { type: String, enum: ['SHOP_OWNER', 'DELIVERY_BOY'], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: PAYOUT_METHODS, required: true },
    accountDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, default: null },
    },
    status: { type: String, enum: PAYOUT_STATUSES, default: 'PENDING' },
    adminNote: { type: String, default: null },
    processedAt: { type: Date, default: null },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // The reserving DEBIT wallet transaction created the moment this request
    // was submitted — funds are held immediately so the same balance can't
    // be requested twice while a payout is still pending.
    walletTransactionId: { type: Schema.Types.ObjectId, ref: 'WalletTransaction', default: null },
  },
  { timestamps: true }
);

payoutRequestSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
payoutRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
module.exports.PAYOUT_METHODS = PAYOUT_METHODS;
module.exports.PAYOUT_STATUSES = PAYOUT_STATUSES;
