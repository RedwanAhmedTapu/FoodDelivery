const mongoose = require('mongoose');
const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. Small, Medium, Large
    priceModifier: { type: Number, default: 0 }, // added to base price
  },
  { _id: true }
);

const addonSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. Extra cheese
    price: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const foodSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'FoodCategory', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: { type: String, trim: true },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    preparationTime: { type: Number, default: 15 }, // minutes
    ingredients: [{ type: String }],
    allergens: [{ type: String }],
    calories: { type: Number, default: null },
    tags: [{ type: String, index: true }],
    variants: [variantSchema],
    addons: [addonSchema],
    availability: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // null = unlimited
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

foodSchema.index({ storeId: 1 });
foodSchema.index({ categoryId: 1 });
foodSchema.index({ isActive: 1 });
foodSchema.index({ name: 'text', description: 'text', tags: 'text' });
foodSchema.index({ storeId: 1, slug: 1 }, { unique: true });

foodSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.discountPrice != null && this.discountPrice < this.price ? this.discountPrice : this.price;
});
foodSchema.set('toJSON', { virtuals: true });
foodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Food', foodSchema);
