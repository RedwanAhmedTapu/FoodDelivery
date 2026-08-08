const mongoose = require('mongoose');
const { Schema } = mongoose;

const foodCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    icon: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

foodCategorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('FoodCategory', foodCategorySchema);
