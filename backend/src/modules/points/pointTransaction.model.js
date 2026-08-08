const mongoose = require('mongoose');
const { Schema } = mongoose;

const POINT_TYPES = ['EARN', 'REDEEM', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT', 'REFUND', 'EXPIRED'];

const pointTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: POINT_TYPES, required: true },
    points: { type: Number, required: true }, // positive = credit, negative = debit
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String }, // e.g. 'Order', 'Referral'
    referenceId: { type: Schema.Types.ObjectId },
    description: { type: String },
  },
  { timestamps: true }
);

pointTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
module.exports.POINT_TYPES = POINT_TYPES;
