const DeliveryBoy = require('./deliveryBoy.model');
const ApiError = require('../../utils/ApiError');
const { getPagination, paginate } = require('../../utils/pagination');
const { uploadImage } = require('../../config/cloudinary');

async function getMyProfile(userId) {
  const profile = await DeliveryBoy.findOne({ userId });
  if (!profile) throw ApiError.notFound('Delivery boy profile not found');
  return profile;
}

async function updateMyProfile(userId, updates) {
  const allowed = ['name', 'phone', 'vehicleType', 'vehicleNumber', 'licenseInformation'];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });
  const profile = await DeliveryBoy.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
  if (!profile) throw ApiError.notFound('Delivery boy profile not found');
  return profile;
}

async function setOnlineStatus(userId, isOnline) {
  if (isOnline) {
    const existing = await DeliveryBoy.findOne({ userId });
    if (!existing) throw ApiError.notFound('Delivery boy profile not found');
    const [lng, lat] = existing.currentLocation?.coordinates || [0, 0];
    if (lng === 0 && lat === 0) {
      // [0,0] is the schema default — it means this rider has never had a
      // real GPS fix recorded (new registration, or geolocation permission
      // was never granted/denied in the browser). Letting them go "online"
      // anyway makes them invisible to every $near dispatch query without
      // any error anywhere — auto-assign just silently finds nobody. Force
      // a real location first so that failure is loud and immediate instead.
      throw ApiError.badRequest(
        'Set your current location before going online — dispatch needs a real GPS position to find you.'
      );
    }
  }

  const profile = await DeliveryBoy.findOneAndUpdate(
    { userId },
    { isOnline, isAvailable: isOnline }, // going online marks as available for assignment
    { new: true }
  );
  if (!profile) throw ApiError.notFound('Delivery boy profile not found');
  return profile;
}

async function updateLocation(userId, coordinates) {
  const profile = await DeliveryBoy.findOneAndUpdate(
    { userId },
    { currentLocation: { type: 'Point', coordinates } },
    { new: true }
  );
  if (!profile) throw ApiError.notFound('Delivery boy profile not found');
  return profile;
}

async function listAvailableNear(coordinates, radiusKm = 10) {
  return DeliveryBoy.find({
    isOnline: true,
    isAvailable: true,
    status: 'APPROVED',
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).limit(20);
}

/** Pick the nearest available delivery boy for automatic assignment. */
async function findNearestAvailable(coordinates, radiusKm = 10) {
  const candidates = await listAvailableNear(coordinates, radiusKm);
  return candidates[0] || null; // already sorted by distance via $near
}

async function listAll(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.isOnline !== undefined) filter.isOnline = query.isOnline === 'true';
  return paginate(DeliveryBoy, filter, pagination, { populate: 'userId' });
}

async function setApprovalStatus(id, status) {
  const profile = await DeliveryBoy.findByIdAndUpdate(id, { status }, { new: true });
  if (!profile) throw ApiError.notFound('Delivery boy profile not found');
  return profile;
}

async function uploadProfileImage(userId, dataUri) {
  const uploaded = await uploadImage(dataUri, 'food-delivery/delivery-boys');
  const profile = await DeliveryBoy.findOneAndUpdate(
    { userId },
    { profileImage: { url: uploaded.url, publicId: uploaded.publicId } },
    { new: true }
  );
  if (!profile) throw ApiError.notFound('Delivery boy profile not found');
  return profile;
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  setOnlineStatus,
  updateLocation,
  listAvailableNear,
  findNearestAvailable,
  listAll,
  setApprovalStatus,
  uploadProfileImage,
};
