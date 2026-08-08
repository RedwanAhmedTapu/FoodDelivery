const SubscriptionPlan = require('./subscriptionPlan.model');
const StoreSubscription = require('./storeSubscription.model');
const { BILLING_CYCLES, CYCLE_DAYS } = require('./subscriptionPlan.model');
const Store = require('../stores/store.model');
const Payment = require('../payments/payment.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const sslcommerzGateway = require('../payments/gateways/sslcommerz.gateway');

// ---------------------------------------------------------------------------
// Plan management (admin)
// ---------------------------------------------------------------------------

/** Create/update the platform-wide default price for a billing cycle. */
async function upsertGlobalPlan(billingCycle, price, label) {
  if (!BILLING_CYCLES.includes(billingCycle)) throw ApiError.badRequest('Invalid billing cycle');
  return SubscriptionPlan.findOneAndUpdate(
    { storeId: null, billingCycle },
    { price, label, isActive: true },
    { new: true, upsert: true, runValidators: true }
  );
}

/** Create/update a per-store custom price override for a billing cycle. */
async function upsertStoreOverride(storeId, billingCycle, price, label) {
  if (!BILLING_CYCLES.includes(billingCycle)) throw ApiError.badRequest('Invalid billing cycle');
  const store = await Store.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found');

  return SubscriptionPlan.findOneAndUpdate(
    { storeId, billingCycle },
    { price, label, isActive: true },
    { new: true, upsert: true, runValidators: true }
  );
}

async function removeStoreOverride(storeId, billingCycle) {
  await SubscriptionPlan.deleteOne({ storeId, billingCycle });
}

async function listGlobalPlans() {
  const plans = await SubscriptionPlan.find({ storeId: null }).lean();
  const byycle = new Map(plans.map((p) => [p.billingCycle, p]));
  return BILLING_CYCLES.map((cycle) => byycle.get(cycle) || { billingCycle: cycle, price: null, isActive: false });
}

async function listStoreOverrides(storeId) {
  return SubscriptionPlan.find({ storeId }).lean();
}

/**
 * Resolves the price a specific store should pay for a billing cycle:
 * store-specific override if the admin set one, otherwise the global
 * default. Throws if neither exists (admin hasn't configured pricing yet).
 */
async function resolvePlanForStore(storeId, billingCycle) {
  const override = await SubscriptionPlan.findOne({ storeId, billingCycle, isActive: true });
  if (override) return { ...override.toObject(), isOverride: true };

  const global = await SubscriptionPlan.findOne({ storeId: null, billingCycle, isActive: true });
  if (!global) {
    throw ApiError.badRequest(
      `No subscription price configured for ${billingCycle} yet — ask the platform admin to set one.`
    );
  }
  return { ...global.toObject(), isOverride: false };
}

/** Effective price list for a store across all billing cycles (for the pricing UI). */
async function getEffectivePlansForStore(storeId) {
  const results = [];
  for (const cycle of BILLING_CYCLES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const plan = await resolvePlanForStore(storeId, cycle);
      results.push({ billingCycle: cycle, price: plan.price, isOverride: plan.isOverride, label: plan.label });
    } catch {
      results.push({ billingCycle: cycle, price: null, isOverride: false, label: null });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Subscribe / pay flow (shop owner)
// ---------------------------------------------------------------------------

async function assertStoreOwnership(storeId, ownerId, userRole) {
  const store = await Store.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found');
  if (userRole !== 'SUPER_ADMIN' && store.ownerId.toString() !== ownerId.toString()) {
    throw ApiError.forbidden('You do not own this store');
  }
  return store;
}

/**
 * Starts a subscription purchase: resolves the price, creates a
 * PENDING_PAYMENT StoreSubscription, opens an SSLCommerz session, and
 * creates the matching Payment record. Returns the gateway URL for the
 * frontend to redirect the owner to.
 */
async function subscribe(storeId, ownerId, userRole, billingCycle, provider = 'SSLCOMMERZ') {
  if (provider !== 'SSLCOMMERZ') {
    throw ApiError.badRequest('Only SSLCommerz is currently supported for subscription payments');
  }

  const store = await assertStoreOwnership(storeId, ownerId, userRole);
  const plan = await resolvePlanForStore(storeId, billingCycle);
  const owner = await User.findById(store.ownerId);

  const subscription = await StoreSubscription.create({
    storeId: store._id,
    ownerId: store.ownerId,
    planId: plan._id,
    billingCycle,
    price: plan.price,
    status: 'PENDING_PAYMENT',
  });

  const gatewayResult = await sslcommerzGateway.createPayment({
    amount: plan.price,
    refId: subscription._id.toString(),
    prefix: 'SUBSCR',
    productLabel: `${store.name} subscription`,
    customer: { name: owner.name, email: owner.email, phone: owner.phone },
  });

  const payment = await Payment.create({
    purpose: 'SUBSCRIPTION',
    subscriptionId: subscription._id,
    customerId: store.ownerId,
    provider,
    amount: plan.price,
    status: gatewayResult.status,
    providerReference: gatewayResult.providerReference,
    metadata: gatewayResult.raw || {},
  });

  subscription.lastPaymentId = payment._id;
  await subscription.save();

  return { subscription, gatewayPageURL: gatewayResult.raw?.gatewayPageURL || null };
}

/**
 * Called by payment.service once an SSLCommerz subscription payment is
 * confirmed PAID. Activates (or extends) the store's subscription and
 * re-enables the store if it was only off due to a subscription issue.
 */
async function activateFromPayment(payment) {
  const subscription = await StoreSubscription.findById(payment.subscriptionId);
  if (!subscription) return null;

  const store = await Store.findById(subscription.storeId);
  if (!store) return null;

  const now = new Date();
  // If the store still has time left on an active subscription of the same
  // billing cycle, extend from the current expiry rather than resetting the
  // clock to now — renewing early shouldn't lose paid-for time.
  const extendFrom =
    store.subscriptionStatus === 'ACTIVE' && store.subscriptionExpiresAt && store.subscriptionExpiresAt > now
      ? store.subscriptionExpiresAt
      : now;

  const periodEnd = new Date(extendFrom.getTime() + CYCLE_DAYS[subscription.billingCycle] * 24 * 60 * 60 * 1000);

  subscription.status = 'ACTIVE';
  subscription.currentPeriodStart = now;
  subscription.currentPeriodEnd = periodEnd;
  await subscription.save();

  store.subscriptionStatus = 'ACTIVE';
  store.subscriptionExpiresAt = periodEnd;
  store.currentSubscriptionId = subscription._id;

  // Auto re-enable the store if it was only off because of subscription/
  // approval reasons — never override an owner's deliberate manual OFF.
  if (store.approvalStatus === 'APPROVED') {
    if (store.deactivationReason === 'SUBSCRIPTION_EXPIRED' || store.deactivationReason === 'SUBSCRIPTION_REQUIRED') {
      store.isActive = true;
      store.deactivationReason = 'NONE';
    }
  }
  await store.save();

  return subscription;
}

async function getCurrentSubscription(storeId) {
  return StoreSubscription.findOne({ storeId }).sort({ createdAt: -1 });
}

async function getHistory(storeId) {
  return StoreSubscription.find({ storeId }).sort({ createdAt: -1 }).limit(20);
}

/**
 * Human-readable reasons the store is currently not visible to customers,
 * for the shop owner dashboard banner. Always returns isLive accurately
 * derived from the same conditions the public store-listing query uses.
 */
async function getOwnerFacingStatus(storeId, ownerId, userRole) {
  const store = await assertStoreOwnership(storeId, ownerId, userRole);
  const reasons = [];

  if (store.approvalStatus === 'PENDING') {
    reasons.push({
      code: 'PENDING_APPROVAL',
      message: 'Your store is awaiting admin approval before it can go live.',
    });
  }
  if (store.approvalStatus === 'REJECTED') {
    reasons.push({
      code: 'REJECTED',
      message: store.rejectionReason
        ? `Your store was rejected by admin: ${store.rejectionReason}`
        : 'Your store was rejected by admin.',
    });
  }
  if (store.subscriptionStatus === 'NONE') {
    reasons.push({
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'You need an active subscription to activate your store. Choose a plan to get started.',
    });
  }
  if (store.subscriptionStatus === 'EXPIRED') {
    reasons.push({
      code: 'SUBSCRIPTION_EXPIRED',
      message: store.subscriptionExpiresAt
        ? `Your subscription expired on ${store.subscriptionExpiresAt.toDateString()}. Renew to go live again.`
        : 'Your subscription has expired. Renew to go live again.',
    });
  }
  if (store.approvalStatus === 'APPROVED' && store.subscriptionStatus === 'ACTIVE' && !store.isActive) {
    reasons.push({
      code: 'OWNER_DEACTIVATED',
      message: 'Your store is manually turned off. Activate it from the Stores page whenever you\'re ready.',
    });
  }

  const isLive = store.isActive && store.approvalStatus === 'APPROVED' && store.subscriptionStatus === 'ACTIVE';

  return {
    isLive,
    reasons,
    subscriptionStatus: store.subscriptionStatus,
    subscriptionExpiresAt: store.subscriptionExpiresAt,
  };
}

// ---------------------------------------------------------------------------
// Expiry sweep (run on a timer from server.js)
// ---------------------------------------------------------------------------

async function sweepExpiredSubscriptions() {
  const now = new Date();
  const expired = await StoreSubscription.find({ status: 'ACTIVE', currentPeriodEnd: { $lt: now } });

  // eslint-disable-next-line no-restricted-syntax
  for (const sub of expired) {
    // eslint-disable-next-line no-await-in-loop
    sub.status = 'EXPIRED';
    // eslint-disable-next-line no-await-in-loop
    await sub.save();

    // eslint-disable-next-line no-await-in-loop
    await Store.findByIdAndUpdate(sub.storeId, {
      subscriptionStatus: 'EXPIRED',
      isActive: false,
      deactivationReason: 'SUBSCRIPTION_EXPIRED',
    });
  }

  return expired.length;
}

module.exports = {
  upsertGlobalPlan,
  upsertStoreOverride,
  removeStoreOverride,
  listGlobalPlans,
  listStoreOverrides,
  resolvePlanForStore,
  getEffectivePlansForStore,
  subscribe,
  activateFromPayment,
  getCurrentSubscription,
  getHistory,
  getOwnerFacingStatus,
  sweepExpiredSubscriptions,
};
