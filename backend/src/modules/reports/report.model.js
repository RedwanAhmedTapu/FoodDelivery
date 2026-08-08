const mongoose = require('mongoose');
const { Schema } = mongoose;

const REPORT_REASONS = [
  'WRONG_FOOD',
  'MISSING_ITEM',
  'FOOD_QUALITY_ISSUE',
  'LATE_DELIVERY',
  'DAMAGED_PACKAGE',
  'PAYMENT_ISSUE',
  'OTHER',
];

const reportSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    deliveryBoyId: { type: Schema.Types.ObjectId, ref: 'DeliveryBoy', default: null },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    description: { type: String, maxlength: 1000 },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'], default: 'OPEN' },
    adminResponse: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ orderId: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
module.exports.REPORT_REASONS = REPORT_REASONS;
