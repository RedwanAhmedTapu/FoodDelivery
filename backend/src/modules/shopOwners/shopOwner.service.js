const ShopOwnerProfile = require('./shopOwner.model');
const ApiError = require('../../utils/ApiError');
const { getPagination, paginate } = require('../../utils/pagination');
const { uploadImage } = require('../../config/cloudinary');

async function getMyProfile(userId) {
  const profile = await ShopOwnerProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Shop owner profile not found');
  return profile;
}

async function updateMyProfile(userId, updates) {
  const allowed = ['businessName', 'ownerName', 'phone', 'email', 'address'];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });

  const profile = await ShopOwnerProfile.findOneAndUpdate({ userId }, payload, {
    new: true,
    runValidators: true,
  });
  if (!profile) throw ApiError.notFound('Shop owner profile not found');
  return profile;
}

async function uploadProfileImage(userId, dataUri) {
  const uploaded = await uploadImage(dataUri, 'food-delivery/shop-owners');
  const profile = await ShopOwnerProfile.findOneAndUpdate(
    { userId },
    { profileImage: { url: uploaded.url, publicId: uploaded.publicId } },
    { new: true }
  );
  if (!profile) throw ApiError.notFound('Shop owner profile not found');
  return profile;
}

// Adds/replaces a verification document (e.g. trade license, NID) for the
// logged-in shop owner. Only one document per `type` is kept — re-uploading
// the same type overwrites the previous entry rather than piling up stale ones.
async function uploadDocument(userId, type, dataUri) {
  const uploaded = await uploadImage(dataUri, 'food-delivery/shop-owners/documents');
  const profile = await ShopOwnerProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Shop owner profile not found');

  const existingIndex = profile.documents.findIndex((doc) => doc.type === type);
  const entry = { type, url: uploaded.url, publicId: uploaded.publicId };
  if (existingIndex >= 0) {
    profile.documents[existingIndex] = entry;
  } else {
    profile.documents.push(entry);
  }
  await profile.save();
  return profile;
}

async function listShopOwners(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.status) filter.status = query.status;
  return paginate(ShopOwnerProfile, filter, pagination, { populate: 'userId' });
}

async function setApprovalStatus(profileId, approvalStatus, rejectionReason = null) {
  const profile = await ShopOwnerProfile.findByIdAndUpdate(
    profileId,
    { approvalStatus, rejectionReason: approvalStatus === 'REJECTED' ? rejectionReason : null },
    { new: true }
  );
  if (!profile) throw ApiError.notFound('Shop owner profile not found');
  return profile;
}

async function setStatus(profileId, status) {
  const profile = await ShopOwnerProfile.findByIdAndUpdate(profileId, { status }, { new: true });
  if (!profile) throw ApiError.notFound('Shop owner profile not found');
  return profile;
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  uploadDocument,
  listShopOwners,
  setApprovalStatus,
  setStatus,
};
