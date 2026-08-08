const mongoose = require('mongoose');
const { Schema } = mongoose;

const NOTIFICATION_TYPES = [
  'ORDER_PLACED',
  'ORDER_ACCEPTED',
  'ORDER_REJECTED',
  'FOOD_PREPARING',
  'FOOD_READY',
  'DELIVERY_ASSIGNED',
  'DELIVERY_PICKED_UP',
  'DELIVERY_ON_THE_WAY',
  'ORDER_DELIVERED',
  'POINT_EARNED',
  'POINT_REDEEMED',
  'REPORT_UPDATED',
  'PAYOUT_PAID',
  'PAYOUT_REJECTED',
  'COD_REMITTANCE_CONFIRMED',
  'COD_REMITTANCE_REJECTED',
];

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
