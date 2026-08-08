const Cart = require('./cart.model');
const Food = require('../foods/food.model');
const ApiError = require('../../utils/ApiError');

function computeItemUnitPrice(food, variantName) {
  const base = food.discountPrice != null && food.discountPrice < food.price ? food.discountPrice : food.price;
  if (!variantName) return base;
  const variant = food.variants.find((v) => v.name === variantName);
  if (!variant) throw ApiError.badRequest(`Invalid variant "${variantName}" for this food`);
  return base + variant.priceModifier;
}

function resolveAddons(food, addonNames = []) {
  return addonNames.map((name) => {
    const addon = food.addons.find((a) => a.name === name);
    if (!addon) throw ApiError.badRequest(`Invalid addon "${name}" for this food`);
    return { name: addon.name, price: addon.price };
  });
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

async function getCartWithTotals(userId) {
  const cart = await getOrCreateCart(userId);
  return attachTotals(cart);
}

function attachTotals(cart) {
  const subtotal = cart.items.reduce((sum, item) => {
    const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
    return sum + (item.unitPrice + addonsTotal) * item.quantity;
  }, 0);
  return { cart, subtotal: Math.round(subtotal * 100) / 100 };
}

/**
 * Add an item to the cart. If the cart already has items from a different
 * store, the caller must confirm clearing the cart first (forceReplace).
 */
async function addItem(userId, { foodId, quantity = 1, variantName, addonNames, notes, forceReplace }) {
  const food = await Food.findById(foodId);
  if (!food || !food.isActive || !food.availability) {
    throw ApiError.badRequest('Food item is not available');
  }
  if (food.stock !== null && food.stock < quantity) {
    throw ApiError.badRequest('Insufficient stock for this food item');
  }

  const cart = await getOrCreateCart(userId);

  if (cart.storeId && cart.storeId.toString() !== food.storeId.toString()) {
    if (!forceReplace) {
      return {
        conflict: true,
        message: 'Your cart contains items from another store. Clear cart to continue?',
      };
    }
    cart.items = [];
    cart.storeId = null;
  }

  const unitPrice = computeItemUnitPrice(food, variantName);
  const addons = resolveAddons(food, addonNames);

  cart.storeId = food.storeId;
  cart.items.push({
    foodId: food._id,
    name: food.name,
    unitPrice,
    quantity,
    variant: variantName ? { name: variantName, priceModifier: unitPrice - (food.discountPrice ?? food.price) } : undefined,
    addons,
    notes,
  });

  await cart.save();
  return { conflict: false, ...attachTotals(cart) };
}

async function updateItemQuantity(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }

  if (cart.items.length === 0) cart.storeId = null;
  await cart.save();
  return attachTotals(cart);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();
  if (cart.items.length === 0) cart.storeId = null;
  await cart.save();
  return attachTotals(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.storeId = null;
  await cart.save();
  return attachTotals(cart);
}

module.exports = {
  getOrCreateCart,
  getCartWithTotals,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  attachTotals,
};
