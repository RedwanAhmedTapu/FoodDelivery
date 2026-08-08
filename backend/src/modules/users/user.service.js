const User = require('./user.model');
const ApiError = require('../../utils/ApiError');
const { uploadImage } = require('../../config/cloudinary');
const { getPagination, paginate } = require('../../utils/pagination');

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateProfile(userId, updates) {
  const allowed = ['name', 'address', 'dateOfBirth', 'gender'];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });

  if (updates.location && Array.isArray(updates.location.coordinates)) {
    payload.location = { type: 'Point', coordinates: updates.location.coordinates };
  }

  const user = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateAvatar(userId, fileBuffer, dataUri) {
  const uploaded = await uploadImage(dataUri, 'food-delivery/avatars');
  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: { url: uploaded.url, publicId: uploaded.publicId } },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function listUsers(query, filter = {}) {
  const pagination = getPagination(query);
  const finalFilter = { ...filter };
  if (query.role) finalFilter.role = query.role;
  if (query.isActive !== undefined) finalFilter.isActive = query.isActive === 'true';
  if (query.search) {
    finalFilter.$or = [
      { name: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
      { phone: new RegExp(query.search, 'i') },
    ];
  }
  return paginate(User, finalFilter, pagination, { projection: '-password' });
}

async function setActiveStatus(userId, isActive) {
  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

module.exports = { getUserById, updateProfile, updateAvatar, listUsers, setActiveStatus };
