const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../users/user.model');
const ShopOwnerProfile = require('../shopOwners/shopOwner.model');
const DeliveryBoy = require('../delivery/deliveryBoy.model');
const Referral = require('../referrals/referral.model');
const ApiError = require('../../utils/ApiError');
const { generateAuthTokens, verifyRefreshToken } = require('../../utils/generateToken');

async function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function applyReferralIfAny(user, referralCode) {
  if (!referralCode) return;
  const referral = await Referral.findOne({
    $or: [{ code: referralCode }, { customSlug: referralCode }],
    isActive: true,
  });
  if (!referral) return; // silently ignore invalid/expired codes
  if (referral.endDate && referral.endDate < new Date()) return;
  if (referral.maxUsage && referral.usageCount >= referral.maxUsage) return;

  user.referredBy = referral._id;
  await user.save();
  referral.usageCount += 1;
  await referral.save();
}

async function registerUser({ name, email, phone, password, referralCode }, role = 'CUSTOMER') {
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw ApiError.conflict('Email or phone already registered');

  const user = await User.create({ name, email, phone, password, role });
  await applyReferralIfAny(user, referralCode);

  if (role === 'SHOP_OWNER') {
    await ShopOwnerProfile.create({
      userId: user._id,
      businessName: `${name}'s Business`,
      ownerName: name,
      phone,
      email,
    });
  }

  if (role === 'DELIVERY_BOY') {
    await DeliveryBoy.create({ userId: user._id, name, phone });
  }

  const tokens = generateAuthTokens(user);
  user.refreshTokenHash = await hashToken(tokens.refreshToken);
  await user.save();

  return { user, tokens };
}

async function loginUser(identifier, password) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  }).select('+password +refreshTokenHash');

  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (!user.isActive) throw ApiError.forbidden('Account has been deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

  const tokens = generateAuthTokens(user);
  user.refreshTokenHash = await hashToken(tokens.refreshToken);
  await user.save();

  return { user, tokens };
}

async function refreshTokens(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user) throw ApiError.unauthorized('User not found');

  const incomingHash = await hashToken(refreshToken);
  if (user.refreshTokenHash !== incomingHash) {
    throw ApiError.unauthorized('Refresh token has been revoked, please login again');
  }

  const tokens = generateAuthTokens(user);
  user.refreshTokenHash = await hashToken(tokens.refreshToken); // rotate
  await user.save();

  return { user, tokens };
}

async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

async function forgotPassword(identifier) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });
  if (!user) return null; // don't leak existence

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = await hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save();

  // In production: send via email/SMS provider. Returning here for dev/testing.
  return resetToken;
}

async function resetPassword(token, newPassword) {
  const tokenHash = await hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.password = newPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.refreshTokenHash = null; // invalidate existing sessions
  await user.save();

  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword;
  user.refreshTokenHash = null;
  await user.save();
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
};
