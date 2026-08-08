const mongoose = require('mongoose');
const { Schema } = mongoose;

const storeCustomizationSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
    primaryColor: { type: String, default: '#FF5A1F' },
    secondaryColor: { type: String, default: '#1F2937' },
    backgroundColor: { type: String, default: '#FFFFFF' },
    fontStyle: { type: String, default: 'default' },
    buttonStyle: { type: String, enum: ['rounded', 'square', 'pill'], default: 'rounded' },
    banner: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    aboutSection: { type: String, trim: true, maxlength: 2000 },
    contactSection: {
      phone: String,
      email: String,
      socialLinks: {
        facebook: String,
        instagram: String,
        website: String,
      },
    },
    // Free-form custom sections, sanitized (plain text/structured only — no HTML/JS)
    customSections: [
      {
        title: { type: String, maxlength: 100 },
        content: { type: String, maxlength: 2000 },
        order: { type: Number, default: 0 },
      },
    ],
    layout: { type: String, enum: ['grid', 'list'], default: 'grid' },
    showRatings: { type: Boolean, default: true },
    showOffers: { type: Boolean, default: true },
    showPopularFoods: { type: Boolean, default: true },
  },
  { timestamps: true }
);


module.exports = mongoose.model('StoreCustomization', storeCustomizationSchema);
