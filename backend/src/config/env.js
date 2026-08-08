require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  CLIENT_URL: process.env.CLIENT_URL || '*',

  // Used to build absolute callback URLs (SSLCommerz) below. Must include the
  // /api/v1 prefix since that's where the versioned API is actually mounted.
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api/v1',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),

  // --- Dispatch algorithm tuning ---
  DISPATCH_SEARCH_RADIUS_KM: parseFloat(process.env.DISPATCH_SEARCH_RADIUS_KM || '5'),
  DISPATCH_OFFER_WINDOW_SECONDS: parseInt(process.env.DISPATCH_OFFER_WINDOW_SECONDS || '20', 10),
  DISPATCH_MAX_ACTIVE_ORDERS_PER_RIDER: parseInt(process.env.DISPATCH_MAX_ACTIVE_ORDERS_PER_RIDER || '2', 10),
  FRAUD_SCORE_BLOCK_THRESHOLD: parseInt(process.env.FRAUD_SCORE_BLOCK_THRESHOLD || '10', 10),

  // --- Delivery OTP ---
  // OTP is ALWAYS shown to the customer in-app + pushed via Socket.IO — this
  // costs nothing and needs no external service. Email delivery below is an
  // optional *extra* channel using free SMTP (e.g. a Gmail App Password),
  // not a paid SMS gateway. Leave EMAIL_HOST unset to skip it entirely.
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH || '4', 10),
  EMAIL_HOST: process.env.EMAIL_HOST || null,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || null,
  EMAIL_PASS: process.env.EMAIL_PASS || null,
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@rickshawbites.com',

  // SSLCommerz
  SSLCOMMERZ_STORE_ID: process.env.SSLCOMMERZ_STORE_ID,
  SSLCOMMERZ_STORE_PASSWORD: process.env.SSLCOMMERZ_STORE_PASSWORD,
  SSLCOMMERZ_IS_LIVE: process.env.SSLCOMMERZ_IS_LIVE === 'true',

  // এই URL গুলো তৈরি হয় API_BASE_URL থেকে, চাইলে .env-এ আলাদা করে override করতে পারবেন
  SSLCOMMERZ_SUCCESS_URL: process.env.SSLCOMMERZ_SUCCESS_URL || null,
  SSLCOMMERZ_FAIL_URL: process.env.SSLCOMMERZ_FAIL_URL || null,
  SSLCOMMERZ_CANCEL_URL: process.env.SSLCOMMERZ_CANCEL_URL || null,
  SSLCOMMERZ_IPN_URL: process.env.SSLCOMMERZ_IPN_URL || null,
};

env.SSLCOMMERZ_SUCCESS_URL = env.SSLCOMMERZ_SUCCESS_URL || `${env.API_BASE_URL}/payments/sslcommerz/success`;
env.SSLCOMMERZ_FAIL_URL = env.SSLCOMMERZ_FAIL_URL || `${env.API_BASE_URL}/payments/sslcommerz/fail`;
env.SSLCOMMERZ_CANCEL_URL = env.SSLCOMMERZ_CANCEL_URL || `${env.API_BASE_URL}/payments/sslcommerz/cancel`;
env.SSLCOMMERZ_IPN_URL = env.SSLCOMMERZ_IPN_URL || `${env.API_BASE_URL}/payments/sslcommerz/ipn`;

// প্রোডাকশনে SSLCommerz enable থাকলে credential না থাকলে সার্ভার বুট হওয়ার আগেই ধরিয়ে দিন
if (env.NODE_ENV === 'production' && (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD)) {
  // eslint-disable-next-line no-console
  console.warn('⚠️  SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD সেট করা নেই — SSLCommerz payments কাজ করবে না।');
}

module.exports = env;