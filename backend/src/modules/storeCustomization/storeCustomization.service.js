const StoreCustomization = require('./storeCustomization.model');
const Store = require('../stores/store.model');
const ApiError = require('../../utils/ApiError');
const { sanitizeObjectStrings } = require('../../utils/sanitizeText');
const { uploadImage } = require('../../config/cloudinary');
const { assertOwnership } = require('../stores/store.service');

async function getByStoreId(storeId) {
  let customization = await StoreCustomization.findOne({ storeId });
  if (!customization) {
    customization = await StoreCustomization.create({ storeId });
  }
  return customization;
}

async function update(storeId, userId, userRole, updates) {
  const store = await Store.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found');
  await assertOwnership(store, userId, userRole);

  const allowed = [
    'primaryColor',
    'secondaryColor',
    'backgroundColor',
    'fontStyle',
    'buttonStyle',
    'aboutSection',
    'contactSection',
    'customSections',
    'layout',
    'showRatings',
    'showOffers',
    'showPopularFoods',
  ];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = sanitizeObjectStrings(updates[key]);
  });

  const customization = await StoreCustomization.findOneAndUpdate(
    { storeId },
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );

  // keep store.theme in sync for quick access
  if (payload.primaryColor || payload.secondaryColor) {
    store.theme = {
      primaryColor: payload.primaryColor || store.theme.primaryColor,
      secondaryColor: payload.secondaryColor || store.theme.secondaryColor,
    };
    await store.save();
  }

  return customization;
}

async function uploadBanner(storeId, userId, userRole, dataUri) {
  const store = await Store.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found');
  await assertOwnership(store, userId, userRole);

  const uploaded = await uploadImage(dataUri, 'food-delivery/stores/banners');
  const customization = await StoreCustomization.findOneAndUpdate(
    { storeId },
    { banner: { url: uploaded.url, publicId: uploaded.publicId } },
    { new: true, upsert: true }
  );
  return customization;
}

module.exports = { getByStoreId, update, uploadBanner };
