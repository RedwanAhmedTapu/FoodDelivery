const mongoose = require('mongoose');

const { Schema } = mongoose;

const WALLET_TXN_TYPES = ['CREDIT', 'DEBIT'];
const WALLET_TXN_REFERENCE_TYPES = ['ORDER', 'PAYOUT', 'COD_REMITTANCE', 'ADJUSTMENT'];

// Append-only ledger. wallet.balance is a cached running total; this
// collection is the source of truth / audit trail behind it — every balance
// change must create exactly one of these alongside it (see wallet.service).
const walletTransactionSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    ownerType: { type: String, enum: ['SHOP_OWNER', 'DELIVERY_BOY'], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: WALLET_TXN_TYPES, required: true },
    amount: { type: Number, required: true }, // always positive; `type` gives direction
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String, enum: WALLET_TXN_REFERENCE_TYPES, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
module.exports.WALLET_TXN_TYPES = WALLET_TXN_TYPES;
module.exports.WALLET_TXN_REFERENCE_TYPES = WALLET_TXN_REFERENCE_TYPES;
