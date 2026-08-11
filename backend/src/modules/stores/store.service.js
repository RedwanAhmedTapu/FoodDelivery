const Store = require('./store.model');
const ApiError = require('../../utils/ApiError');
const { generateUniqueSlug } = require('../../utils/generateSlug');
const { getPagination, paginate } = require('../../utils/pagination');
const { uploadImage } = require('../../config/cloudinary');

async function createStore(ownerId, payload) {
  const slug = await generateUniqueSlug(Store, payload.name);

  const store = await Store.create({
    ownerId,
    name: payload.name,
    slug,
    description: payload.description,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    location: { type: 'Point', coordinates: payload.coordinates },
    openingTime: payload.openingTime,
    closingTime: payload.closingTime,
    deliveryRadius: payload.deliveryRadius,
    minimumOrder: payload.minimumOrder,
    estimatedDeliveryTime: payload.estimatedDeliveryTime,
  });

  return store;
}

async function assertOwnership(store, userId, userRole) {
  if (userRole === 'SUPER_ADMIN') return;
  if (store.ownerId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You do not own this store');
  }
}

async function getStoreById(id) {
  const store = await Store.findById(id);
  if (!store) throw ApiError.notFound('Store not found');
  return store;
}

async function getStoreBySlug(slug) {
  const store = await Store.findOne({ slug });
  if (!store) throw ApiError.notFound('Store not found');
  return store;
}

async function updateStore(storeId, userId, userRole, updates) {
  const store = await getStoreById(storeId);
  await assertOwnership(store, userId, userRole);

  const allowed = [
    'name',
    'description',
    'phone',
    'email',
    'address',
    'openingTime',
    'closingTime',
    'deliveryRadius',
    'minimumOrder',
    'estimatedDeliveryTime',
  ];
  allowed.forEach((key) => {
    if (updates[key] !== undefined) store[key] = updates[key];
  });

  if (updates.coordinates) {
    store.location = { type: 'Point', coordinates: updates.coordinates };
  }
  if (updates.name && updates.name !== store.name) {
    store.slug = await generateUniqueSlug(Store, updates.name);
  }

  await store.save();
  return store;
}

async function deleteStore(storeId, userId, userRole) {
  const store = await getStoreById(storeId);
  await assertOwnership(store, userId, userRole);
  await store.deleteOne();
}

async function setActivation(storeId, userId, userRole, isActive) {
  const store = await getStoreById(storeId);
  await assertOwnership(store, userId, userRole);

  if (isActive) {
    if (store.approvalStatus !== 'APPROVED') {
      throw ApiError.badRequest('Store must be approved before activation');
    }
    if (store.subscriptionStatus !== 'ACTIVE') {
      throw ApiError.badRequest(
        store.subscriptionStatus === 'EXPIRED'
          ? 'Your subscription has expired. Renew it to reactivate your store.'
          : 'You need an active subscription before you can activate your store.'
      );
    }
    store.deactivationReason = 'NONE';
  } else {
    store.deactivationReason = 'OWNER_DEACTIVATED';
  }

  store.isActive = isActive;
  await store.save();
  return store;
}

async function setApprovalStatus(storeId, approvalStatus, rejectionReason = null) {
  const store = await getStoreById(storeId);
  store.approvalStatus = approvalStatus;
  store.rejectionReason = approvalStatus === 'REJECTED' ? rejectionReason : null;

  if (approvalStatus === 'REJECTED') {
    store.isActive = false;
    store.deactivationReason = 'REJECTED';
  } else if (approvalStatus === 'PENDING') {
    store.isActive = false;
    store.deactivationReason = 'PENDING_APPROVAL';
  } else if (approvalStatus === 'APPROVED') {
    // Approval alone doesn't turn the store on — it still needs an active
    // subscription. The owner activates it themselves once both are true.
    store.isActive = false;
    store.deactivationReason = store.subscriptionStatus === 'ACTIVE' ? 'OWNER_DEACTIVATED' : 'SUBSCRIPTION_REQUIRED';
  }

  await store.save();
  return store;
}

async function getMyStores(ownerId, query) {
  const pagination = getPagination(query);
  const filter = { ownerId };
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return paginate(Store, filter, pagination);
}

async function listActiveStores(query) {
  const pagination = getPagination(query);
  const filter = { isActive: true, approvalStatus: 'APPROVED' };
  if (query.search) filter.$text = { $search: query.search };
  return paginate(Store, filter, pagination, { sort: { rating: -1 } });
}

/** Admin-only: list every store regardless of approval/active status. */
async function listAllForAdmin(query) {
  const pagination = getPagination(query);
  const filter = {};

  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  // Aggregation pipeline
  const pipeline = [
    { $match: filter },
    // ShopOwnerProfile theke ownerName ber korar jonno lookup
    {
      $lookup: {
        from: 'shopownerprofiles', // DB te collection name ta ki hobe seta dekhen (usually lowercase plural)
        localField: 'ownerId',
        foreignField: 'userId',
        as: 'ownerDetails'
      }
    },
    // Array theke object ba ber kora
    {
      $unwind: {
        path: '$ownerDetails',
        preserveNullAndEmptyArrays: true // Jodi kono store owner er profile na thake tahole o store ta dekhabe
      }
    },
    // Response e easily pawar jonno alada field hishebe add kora holo
    {
      $addFields: {
        ownerName: { $ifNull: ['$ownerDetails.ownerName', 'N/A'] }
      }
    },
    { $sort: { createdAt: -1 } }
  ];

  // --- PAGINATION LOGIC ---
  // Total count ber kora
  const countPipeline = [{ $match: filter }, { $count: 'total' }];
  const countResult = await Store.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Data with skip and limit
  const dataPipeline = [
    ...pipeline,
    { $skip: (pagination.page - 1) * pagination.limit },
    { $limit: pagination.limit }
  ];

  const items = await Store.aggregate(dataPipeline);

  const meta = {
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit)
  };

  return { items, meta };
}

async function findNearbyStores({ lng, lat, radius = 5, page, limit }) {
  const pagination = getPagination({ page, limit });
  const filter = {
    isActive: true,
    approvalStatus: 'APPROVED',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius * 1000, // meters
      },
    },
  };
  // $near already sorts by distance; avoid conflicting sort
  const [items, total] = await Promise.all([
    Store.find(filter).skip(pagination.skip).limit(pagination.limit).lean(),
    Store.countDocuments({ isActive: true, approvalStatus: 'APPROVED' }),
  ]);
  return { items, meta: { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) || 1 } };
}

async function uploadStoreImage(storeId, userId, userRole, field, dataUri) {
  const store = await getStoreById(storeId);
  await assertOwnership(store, userId, userRole);

  const uploaded = await uploadImage(dataUri, `food-delivery/stores/${field}`);
  store[field] = { url: uploaded.url, publicId: uploaded.publicId };
  await store.save();
  return store;
}

module.exports = {
  createStore,
  getStoreById,
  getStoreBySlug,
  updateStore,
  deleteStore,
  setActivation,
  setApprovalStatus,
  getMyStores,
  listActiveStores,
  listAllForAdmin,
  findNearbyStores,
  uploadStoreImage,
  assertOwnership,
};
