const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', default: null },
    type: { type: String, enum: ['STORE', 'FOOD', 'DELIVERY'], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000, trim: true },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for the same order/type/target unless editing (upsert-style enforced in service)
reviewSchema.index({ orderId: 1, type: 1, foodId: 1 }, { unique: true });
reviewSchema.index({ storeId: 1 });
reviewSchema.index({ foodId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
