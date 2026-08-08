const FoodCategory = require('./foodCategory.model');
const ApiError = require('../../utils/ApiError');
const { generateUniqueSlug } = require('../../utils/generateSlug');
const { getPagination, paginate } = require('../../utils/pagination');
const { uploadImage } = require('../../config/cloudinary');

async function create(payload) {
  const slug = await generateUniqueSlug(FoodCategory, payload.name);
  return FoodCategory.create({ ...payload, slug });
}

async function update(id, updates) {
  const category = await FoodCategory.findById(id);
  if (!category) throw ApiError.notFound('Food category not found');

  const allowed = ['name', 'description', 'icon', 'sortOrder'];
  allowed.forEach((key) => {
    if (updates[key] !== undefined) category[key] = updates[key];
  });
  if (updates.name && updates.name !== category.name) {
    category.slug = await generateUniqueSlug(FoodCategory, updates.name);
  }
  await category.save();
  return category;
}

async function remove(id) {
  const category = await FoodCategory.findByIdAndDelete(id);
  if (!category) throw ApiError.notFound('Food category not found');
}

async function setActive(id, isActive) {
  const category = await FoodCategory.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!category) throw ApiError.notFound('Food category not found');
  return category;
}

async function list(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return paginate(FoodCategory, filter, pagination, { sort: { sortOrder: 1 } });
}

async function listAllActive() {
  return FoodCategory.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
}

async function uploadCategoryImage(id, dataUri) {
  const category = await FoodCategory.findById(id);
  if (!category) throw ApiError.notFound('Food category not found');
  const uploaded = await uploadImage(dataUri, 'food-delivery/categories');
  category.image = { url: uploaded.url, publicId: uploaded.publicId };
  await category.save();
  return category;
}

async function reorder(orderedIds) {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { sortOrder: index } },
  }));
  if (bulkOps.length) await FoodCategory.bulkWrite(bulkOps);
  return listAllActive();
}

module.exports = { create, update, remove, setActive, list, listAllActive, uploadCategoryImage, reorder };
