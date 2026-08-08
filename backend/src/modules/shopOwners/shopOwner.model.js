const mongoose = require('mongoose');
const { Schema } = mongoose;

const shopOwnerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    address: { type: String, trim: true },
    documents: [
      {
        type: { type: String }, // e.g. TRADE_LICENSE, NID
        url: String,
        publicId: String,
      },
    ],
    profileImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

shopOwnerSchema.index({ approvalStatus: 1 });

module.exports = mongoose.model('ShopOwnerProfile', shopOwnerSchema);
