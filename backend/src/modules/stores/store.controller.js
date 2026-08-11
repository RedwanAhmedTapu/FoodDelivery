const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./store.service');

const createStore = catchAsync(async (req, res) => {
  const store = await service.createStore(req.user._id, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Store created successfully', data: store });
});

const getStore = catchAsync(async (req, res) => {
  const store = await service.getStoreById(req.params.id);
  ApiResponse.success(res, { message: 'Store fetched', data: store });
});

const getStoreBySlug = catchAsync(async (req, res) => {
  const store = await service.getStoreBySlug(req.params.slug);
  ApiResponse.success(res, { message: 'Store fetched', data: store });
});

const updateStore = catchAsync(async (req, res) => {
  const store = await service.updateStore(req.params.id, req.user._id, req.user.role, req.body);
  ApiResponse.success(res, { message: 'Store updated successfully', data: store });
});

const deleteStore = catchAsync(async (req, res) => {
  await service.deleteStore(req.params.id, req.user._id, req.user.role);
  ApiResponse.success(res, { message: 'Store deleted successfully' });
});

const activateStore = catchAsync(async (req, res) => {
  const store = await service.setActivation(req.params.id, req.user._id, req.user.role, true);
  ApiResponse.success(res, { message: 'Store activated', data: store });
});

const deactivateStore = catchAsync(async (req, res) => {
  const store = await service.setActivation(req.params.id, req.user._id, req.user.role, false);
  ApiResponse.success(res, { message: 'Store deactivated', data: store });
});

const setApprovalStatus = catchAsync(async (req, res) => {
  const { approvalStatus, rejectionReason } = req.body;
  const store = await service.setApprovalStatus(req.params.id, approvalStatus, rejectionReason);
  ApiResponse.success(res, { message: 'Store approval status updated', data: store });
});

const getMyStores = catchAsync(async (req, res) => {
  const { items, meta } = await service.getMyStores(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Stores fetched', data: items, meta });
});

const listActiveStores = catchAsync(async (req, res) => {
  const { items, meta } = await service.listActiveStores(req.query);
  ApiResponse.success(res, { message: 'Stores fetched', data: items, meta });
});

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

const findNearbyStores = catchAsync(async (req, res) => {
  const { items, meta } = await service.findNearbyStores(req.query);
  ApiResponse.success(res, { message: 'Nearby stores fetched', data: items, meta });
});

const uploadLogo = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const store = await service.uploadStoreImage(req.params.id, req.user._id, req.user.role, 'logo', dataUri);
  ApiResponse.success(res, { message: 'Logo uploaded', data: store });
});

const uploadCoverImage = catchAsync(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, { statusCode: 400, message: 'Image is required' });
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const store = await service.uploadStoreImage(
    req.params.id,
    req.user._id,
    req.user.role,
    'coverImage',
    dataUri
  );
  ApiResponse.success(res, { message: 'Cover image uploaded', data: store });
});

module.exports = {
  createStore,
  getStore,
  getStoreBySlug,
  updateStore,
  deleteStore,
  activateStore,
  deactivateStore,
  setApprovalStatus,
  getMyStores,
  listActiveStores,
  listAllForAdmin,
  findNearbyStores,
  uploadLogo,
  uploadCoverImage,
};
