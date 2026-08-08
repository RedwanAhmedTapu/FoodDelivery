const Food = require('./food.model');
const Store = require('../stores/store.model');
const FoodCategory = require('../foodCategories/foodCategory.model');
const ApiError = require('../../utils/ApiError');
const { slugify } = require('../../utils/generateSlug');
const { getPagination, paginate } = require('../../utils/pagination');
const { uploadImage } = require('../../config/cloudinary');

async function assertStoreOwnership(storeId, userId, userRole) {
  const store = await Store.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found');
  if (userRole !== 'SUPER_ADMIN' && store.ownerId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You do not own this store');
  }
  return store;
}

async function createFood(userId, userRole, payload) {
  const store = await assertStoreOwnership(payload.storeId, userId, userRole);

  const category = await FoodCategory.findOne({ _id: payload.categoryId, isActive: true });
  if (!category) throw ApiError.badRequest('Invalid or inactive food category');

  let slug = slugify(payload.name);
  const existing = await Food.findOne({ storeId: store._id, slug });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const food = await Food.create({
    ...payload,
    ownerId: store.ownerId,
    slug,
  });
  return food;
}

async function getFoodById(id) {
  const food = await Food.findById(id).populate('categoryId storeId');
  if (!food) throw ApiError.notFound('Food not found');
  return food;
}

async function assertFoodOwnership(food, userId, userRole) {
  if (userRole === 'SUPER_ADMIN') return;
  if (food.ownerId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You do not own this food item');
  }
}

async function updateFood(id, userId, userRole, updates) {
  const food = await Food.findById(id);
  if (!food) throw ApiError.notFound('Food not found');
  await assertFoodOwnership(food, userId, userRole);

  if (updates.categoryId) {
    const category = await FoodCategory.findOne({ _id: updates.categoryId, isActive: true });
    if (!category) throw ApiError.badRequest('Invalid or inactive food category');
  }

  const allowed = [
    'name',
    'description',
    'price',
    'discountPrice',
    'preparationTime',
    'ingredients',
    'allergens',
    'calories',
    'tags',
    'variants',
    'addons',
    'stock',
    'categoryId',
    'availability',
    'isFeatured',
  ];
  allowed.forEach((key) => {
    if (updates[key] !== undefined) food[key] = updates[key];
  });

  if (updates.name && updates.name !== food.name) {
    food.slug = `${slugify(updates.name)}-${Date.now().toString(36)}`;
  }

  await food.save();
  return food;
}

async function deleteFood(id, userId, userRole) {
  const food = await Food.findById(id);
  if (!food) throw ApiError.notFound('Food not found');
  await assertFoodOwnership(food, userId, userRole);
  await food.deleteOne();
}

async function setActive(id, userId, userRole, isActive) {
  const food = await Food.findById(id);
  if (!food) throw ApiError.notFound('Food not found');
  await assertFoodOwnership(food, userId, userRole);
  food.isActive = isActive;
  await food.save();
  return food;
}

async function listByStore(storeId, query) {
  const pagination = getPagination(query);
  const filter = { storeId };
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return paginate(Food, filter, pagination);
}

function buildSortStage(sortBy) {
  switch (sortBy) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'rating':
      return { rating: -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'popularity':
    default:
      return { totalOrders: -1 };
  }
}

async function searchFoods(query) {
  const pagination = getPagination(query);
  const filter = { isActive: true, availability: true };

  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.storeId) filter.storeId = query.storeId;
  if (query.search) filter.$text = { $search: query.search };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }
  if (query.minRating) filter.rating = { $gte: query.minRating };

  return paginate(Food, filter, pagination, {
    sort: buildSortStage(query.sortBy),
    populate: [{ path: 'categoryId', select: 'name slug' }, { path: 'storeId', select: 'name slug isActive' }],
  });
}

async function uploadFoodImages(id, userId, userRole, files) {
  const food = await Food.findById(id);
  if (!food) throw ApiError.notFound('Food not found');
  await assertFoodOwnership(food, userId, userRole);

  const uploads = await Promise.all(
    files.map((file) => {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return uploadImage(dataUri, 'food-delivery/foods');
    })
  );

  food.images.push(...uploads.map((u) => ({ url: u.url, publicId: u.publicId })));
  await food.save();
  return food;
}

async function adjustStock(id, delta) {
  const food = await Food.findById(id);
  if (!food || food.stock === null) return; // unlimited stock, no-op
  food.stock = Math.max(0, food.stock + delta);
  if (food.stock === 0) food.availability = false;
  await food.save();
}

module.exports = {
  createFood,
  getFoodById,
  updateFood,
  deleteFood,
  setActive,
  listByStore,
  searchFoods,
  uploadFoodImages,
  adjustStock,
  assertStoreOwnership,
  assertFoodOwnership,
};
