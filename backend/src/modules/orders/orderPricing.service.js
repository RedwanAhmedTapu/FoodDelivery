const PlatformSettings = require('../platformSettings/platformSettings.model');
const { calculateDistanceKm } = require('../../utils/calculateDistance');

/**
 * Compute platform fee from current settings. Result is a snapshot value
 * to be stored on the order — historical orders must not be recalculated
 * if settings change later.
 */
function calculatePlatformFee(subtotal, settings) {
  const { type, value, minOrderAmount, maxFeeAmount } = settings.platformFee;
  if (subtotal < minOrderAmount) return 0;

  let fee = type === 'FIXED' ? value : (subtotal * value) / 100;
  if (maxFeeAmount != null) fee = Math.min(fee, maxFeeAmount);
  return Math.round(fee * 100) / 100;
}

function calculateDeliveryFee(storeCoordinates, deliveryCoordinates, settings) {
  const distanceKm = calculateDistanceKm(storeCoordinates, deliveryCoordinates);
  const { baseFee, perKmFee } = settings.deliveryFee;
  const fee = baseFee + distanceKm * perKmFee;
  return { fee: Math.round(fee * 100) / 100, distanceKm };
}

function calculateTax(subtotal, settings) {
  return Math.round(((subtotal * settings.taxPercentage) / 100) * 100) / 100;
}

/**
 * Calculate points discount from a requested point redemption amount.
 * Enforces the max-redeem-percent-of-order cap and rounds down to whole points.
 */
function calculatePointsDiscount(requestedPoints, subtotal, availableBalance, settings) {
  if (!requestedPoints || requestedPoints <= 0) return { pointsUsed: 0, pointDiscount: 0 };

  const { redeemPointsPerUnit, redeemValuePerUnit, maxRedeemPercentOfOrder } = settings.pointsRules;
  const maxDiscountAllowed = (subtotal * maxRedeemPercentOfOrder) / 100;

  let pointsUsed = Math.min(requestedPoints, availableBalance);
  let pointDiscount = (pointsUsed / redeemPointsPerUnit) * redeemValuePerUnit;

  if (pointDiscount > maxDiscountAllowed) {
    pointDiscount = maxDiscountAllowed;
    pointsUsed = Math.floor((pointDiscount / redeemValuePerUnit) * redeemPointsPerUnit);
    pointDiscount = (pointsUsed / redeemPointsPerUnit) * redeemValuePerUnit;
  }

  return {
    pointsUsed: Math.round(pointsUsed),
    pointDiscount: Math.round(pointDiscount * 100) / 100,
  };
}

function calculateEarnedPoints(subtotal, settings) {
  const { earnRatePer100 } = settings.pointsRules;
  return Math.floor((subtotal / 100) * earnRatePer100);
}

/**
 * Master pricing function. All order totals must flow through here using
 * current database values — the frontend's numbers are never trusted.
 */
async function calculateOrderPricing({
  items, // [{ unitPrice, quantity, addons: [{price}] }]
  storeCoordinates,
  deliveryCoordinates,
  storeDiscount = 0,
  requestedPointsToRedeem = 0,
  customerPointsBalance = 0,
}) {
  const settings = await PlatformSettings.getSettings();

  const subtotal = items.reduce((sum, item) => {
    const addonsTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
    return sum + (item.unitPrice + addonsTotal) * item.quantity;
  }, 0);

  const { fee: deliveryFee, distanceKm } = calculateDeliveryFee(storeCoordinates, deliveryCoordinates, settings);
  const platformFee = calculatePlatformFee(subtotal, settings);
  const tax = calculateTax(subtotal, settings);
  const { pointsUsed, pointDiscount } = calculatePointsDiscount(
    requestedPointsToRedeem,
    subtotal,
    customerPointsBalance,
    settings
  );

  const total = Math.max(
    0,
    Math.round((subtotal + tax + deliveryFee + platformFee - storeDiscount - pointDiscount) * 100) / 100
  );

  const earnedPoints = calculateEarnedPoints(subtotal, settings);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: storeDiscount,
    pointsUsed,
    pointDiscount,
    deliveryFee,
    platformFee,
    tax,
    total,
    distanceKm: Math.round(distanceKm * 100) / 100,
    earnedPoints,
    settingsSnapshot: settings.toObject(),
  };
}

module.exports = {
  calculatePlatformFee,
  calculateDeliveryFee,
  calculateTax,
  calculatePointsDiscount,
  calculateEarnedPoints,
  calculateOrderPricing,
};
