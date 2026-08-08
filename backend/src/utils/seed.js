/**
 * Seeds a full set of demo accounts so you can log in and test every role
 * immediately after setup, instead of registering each one by hand:
 *   - SUPER_ADMIN  (no public registration route exists for this role)
 *   - CUSTOMER     (with some starting points balance)
 *   - SHOP_OWNER   (approved, with one approved+subscribed demo store, a
 *                   food category, and a couple of menu items)
 *   - DELIVERY_BOY (approved, ready to go online)
 *
 * Also seeds global subscription pricing for all four billing cycles so
 * the admin "Subscriptions & pricing" page and the shop owner's
 * "Subscription" page aren't empty on first run.
 *
 * Usage:
 *   npm run seed
 *
 * All passwords default to the same value below unless overridden via env
 * vars — change them after logging in. Safe to re-run: existing accounts
 * (matched by email) are left untouched rather than duplicated.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../modules/users/user.model');
const ShopOwnerProfile = require('../modules/shopOwners/shopOwner.model');
const DeliveryBoy = require('../modules/delivery/deliveryBoy.model');
const Store = require('../modules/stores/store.model');
const FoodCategory = require('../modules/foodCategories/foodCategory.model');
const Food = require('../modules/foods/food.model');
const SubscriptionPlan = require('../modules/subscriptions/subscriptionPlan.model');
const StoreSubscription = require('../modules/subscriptions/storeSubscription.model');
const { slugify } = require('./generateSlug');

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'ChangeMe123!';

async function upsertUser({ name, email, phone, role, password = DEFAULT_PASSWORD }) {
  let user = await User.findOne({ email });
  if (user) {
    console.log(`[seed] ${role} "${email}" already exists — skipping creation.`);
    return { user, created: false };
  }
  user = await User.create({ name, email, phone, password, role, isActive: true, isVerified: true });
  return { user, created: true };
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@rickshawbites.com';
  const phone = process.env.ADMIN_PHONE || '01700000000';
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Platform Admin';

  const { user } = await upsertUser({ name, email, phone, role: 'SUPER_ADMIN', password });
  return { email, password, user };
}

async function seedCustomer() {
  const email = 'customer@rickshawbites.com';
  const { user } = await upsertUser({
    name: 'Demo Customer',
    email,
    phone: '01700000002',
    role: 'CUSTOMER',
  });
  if (user.pointsBalance === 0) {
    user.pointsBalance = 100; // a little starting balance so redemption is testable right away
    await user.save();
  }
  return { email, password: DEFAULT_PASSWORD };
}

async function seedGlobalSubscriptionPlans() {
  const defaults = [
    { billingCycle: 'MONTHLY', price: 500 },
    { billingCycle: 'QUARTERLY', price: 1350 },
    { billingCycle: 'HALF_YEARLY', price: 2500 },
    { billingCycle: 'YEARLY', price: 4500 },
  ];
  for (const plan of defaults) {
    // eslint-disable-next-line no-await-in-loop
    await SubscriptionPlan.findOneAndUpdate(
      { storeId: null, billingCycle: plan.billingCycle },
      { price: plan.price, isActive: true },
      { upsert: true }
    );
  }
  console.log('[seed] Global subscription pricing ready (monthly/quarterly/half-yearly/yearly).');
}

async function seedShopOwnerWithStore() {
  const email = 'shopowner@rickshawbites.com';
  const { user, created } = await upsertUser({
    name: 'Demo Shop Owner',
    email,
    phone: '01700000003',
    role: 'SHOP_OWNER',
  });

  if (created) {
    await ShopOwnerProfile.create({
      userId: user._id,
      businessName: "Demo Owner's Kitchen",
      ownerName: user.name,
      phone: user.phone,
      email: user.email,
      approvalStatus: 'APPROVED',
    });
  } else {
    await ShopOwnerProfile.findOneAndUpdate({ userId: user._id }, { approvalStatus: 'APPROVED' });
  }

  let store = await Store.findOne({ ownerId: user._id });
  if (!store) {
    const slug = await require('./generateSlug').generateUniqueSlug(Store, 'Demo Biryani House');
    store = await Store.create({
      ownerId: user._id,
      name: 'Demo Biryani House',
      slug,
      description: 'Seeded demo store — home-style biryani and grills.',
      phone: user.phone,
      email: user.email,
      address: '12 Gulshan Avenue, Dhaka',
      location: { type: 'Point', coordinates: [90.4125, 23.8103] }, // Dhaka
      minimumOrder: 150,
      estimatedDeliveryTime: 30,
      approvalStatus: 'APPROVED',
    });
    console.log('[seed] Demo store created.');
  }

  // Give the demo store an active subscription so it can actually go live
  // without needing to click through a real SSLCommerz payment first.
  let subscription = await StoreSubscription.findOne({ storeId: store._id, status: 'ACTIVE' });
  if (!subscription) {
    const globalPlan = await SubscriptionPlan.findOne({ storeId: null, billingCycle: 'MONTHLY' });
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    subscription = await StoreSubscription.create({
      storeId: store._id,
      ownerId: user._id,
      planId: globalPlan?._id,
      billingCycle: 'MONTHLY',
      price: globalPlan?.price || 500,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    });
    store.subscriptionStatus = 'ACTIVE';
    store.subscriptionExpiresAt = periodEnd;
    store.currentSubscriptionId = subscription._id;
    store.isActive = true;
    store.deactivationReason = 'NONE';
    await store.save();
    console.log('[seed] Demo store subscribed (active for 30 days) and activated.');
  }

  // A category + a couple of menu items so the storefront isn't empty.
  let category = await FoodCategory.findOne({ name: 'Biryani' });
  if (!category) {
    category = await FoodCategory.create({ name: 'Biryani', slug: 'biryani', isActive: true });
  }

  const existingFoodCount = await Food.countDocuments({ storeId: store._id });
  if (existingFoodCount === 0) {
    await Food.insertMany([
      {
        storeId: store._id,
        ownerId: user._id,
        categoryId: category._id,
        name: 'Chicken Biryani',
        slug: slugify('Chicken Biryani') + '-demo1',
        description: 'Slow-cooked basmati rice with tender chicken and house spices.',
        price: 280,
        preparationTime: 25,
        variants: [
          { name: 'Regular', priceModifier: 0 },
          { name: 'Large', priceModifier: 80 },
        ],
        addons: [
          { name: 'Extra chicken', price: 60 },
          { name: 'Boiled egg', price: 25 },
        ],
        isActive: true,
        availability: true,
      },
      {
        storeId: store._id,
        ownerId: user._id,
        categoryId: category._id,
        name: 'Beef Tehari',
        slug: slugify('Beef Tehari') + '-demo2',
        description: 'Classic Old Dhaka-style beef tehari.',
        price: 250,
        preparationTime: 25,
        isActive: true,
        availability: true,
      },
    ]);
    console.log('[seed] Demo menu items created.');
  }

  return { email, password: DEFAULT_PASSWORD, storeName: store.name };
}

async function seedDeliveryBoy() {
  const email = 'delivery@rickshawbites.com';
  const { user, created } = await upsertUser({
    name: 'Demo Rider',
    email,
    phone: '01700000004',
    role: 'DELIVERY_BOY',
  });

  if (created) {
    await DeliveryBoy.create({
      userId: user._id,
      name: user.name,
      phone: user.phone,
      status: 'APPROVED',
      // Placed near the demo store (Gulshan, Dhaka) so dispatch can find them
      // in a local test without needing real GPS.
      currentLocation: { type: 'Point', coordinates: [90.4152, 23.8125] },
    });
  } else {
    await DeliveryBoy.findOneAndUpdate({ userId: user._id }, { status: 'APPROVED' });
  }

  return { email, password: DEFAULT_PASSWORD };
}

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('[seed] Connected to MongoDB\n');

  const admin = await seedAdmin();
  const customer = await seedCustomer();
  await seedGlobalSubscriptionPlans();
  const shopOwner = await seedShopOwnerWithStore();
  const deliveryBoy = await seedDeliveryBoy();

  console.log('\n[seed] Done. Demo accounts (password is the same for all unless overridden):\n');
  console.table([
    { role: 'SUPER_ADMIN', email: admin.email, password: admin.password },
    { role: 'CUSTOMER', email: customer.email, password: customer.password },
    { role: 'SHOP_OWNER', email: shopOwner.email, password: shopOwner.password, store: shopOwner.storeName },
    { role: 'DELIVERY_BOY', email: deliveryBoy.email, password: deliveryBoy.password },
  ]);
  console.log('\n[seed] Change these passwords before using this in anything resembling production.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
