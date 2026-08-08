const mongoose = require('mongoose');

const { Schema } = mongoose;

const REMITTANCE_METHODS = ['CASH_HANDOVER', 'BANK', 'BKASH', 'NAGAD'];
const REMITTANCE_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED'];

// A rider's wallet goes negative as they collect COD cash that isn't
// theirs (see wallet.service.settleOrderEarnings). This is how that debt
// clears: the rider declares they've handed cash to the store/office or
// deposited it to the platform's bank/mobile-banking account, and an admin
// confirms it actually arrived before the debt is forgiven.
const codRemittanceSchema = new Schema(
  {
    deliveryBoyUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: REMITTANCE_METHODS, default: 'CASH_HANDOVER' },
    reference: { type: String, default: null }, // e.g. bKash txn id, bank deposit slip no.
    status: { type: String, enum: REMITTANCE_STATUSES, default: 'PENDING' },
    note: { type: String, default: null },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

codRemittanceSchema.index({ deliveryBoyUserId: 1, createdAt: -1 });
codRemittanceSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CodRemittance', codRemittanceSchema);
module.exports.REMITTANCE_METHODS = REMITTANCE_METHODS;
module.exports.REMITTANCE_STATUSES = REMITTANCE_STATUSES;
