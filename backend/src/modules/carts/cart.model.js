const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true }, // snapshot
    unitPrice: { type: Number, required: true }, // snapshot (incl. variant)
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      name: String,
      priceModifier: { type: Number, default: 0 },
    },
    addons: [
      {
        name: String,
        price: { type: Number, default: 0 },
      },
    ],
    notes: { type: String, maxlength: 300 },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
