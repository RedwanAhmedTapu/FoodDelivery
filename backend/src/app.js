const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./docs/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const shopOwnerRoutes = require('./modules/shopOwners/shopOwner.routes');
const storeRoutes = require('./modules/stores/store.routes');
const storeCustomizationRoutes = require('./modules/storeCustomization/storeCustomization.routes');
const foodCategoryRoutes = require('./modules/foodCategories/foodCategory.routes');
const foodRoutes = require('./modules/foods/food.routes');
const bulkFoodUploadRoutes = require('./modules/bulkFoodUpload/bulkFoodUpload.routes');
const cartRoutes = require('./modules/carts/cart.routes');
const orderRoutes = require('./modules/orders/order.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const pointRoutes = require('./modules/points/point.routes');
const referralRoutes = require('./modules/referrals/referral.routes');
const recommendationRoutes = require('./modules/recommendations/recommendation.routes');
const deliveryBoyRoutes = require('./modules/delivery/deliveryBoy.routes');
const reportRoutes = require('./modules/reports/report.routes');
const reviewRoutes = require('./modules/reviews/review.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const platformSettingsRoutes = require('./modules/platformSettings/platformSettings.routes');
const analyticsRoutes = require('./modules/admins/analytics.routes');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');
const dispatchRoutes = require('./modules/dispatch/dispatch.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Versioned API routes — never expose unversioned APIs
const v1 = express.Router();
v1.use('/auth', authRoutes);
v1.use('/users', userRoutes);
v1.use('/shop-owners', shopOwnerRoutes);
v1.use('/stores', storeRoutes);
v1.use('/store-customization', storeCustomizationRoutes);
v1.use('/categories', foodCategoryRoutes);
v1.use('/foods', foodRoutes);
v1.use('/foods/bulk-upload', bulkFoodUploadRoutes);
v1.use('/cart', cartRoutes);
v1.use('/orders', orderRoutes);
v1.use('/payments', paymentRoutes);
v1.use('/points', pointRoutes);
v1.use('/referrals', referralRoutes);
v1.use('/recommendations', recommendationRoutes);
v1.use('/delivery', deliveryBoyRoutes);
v1.use('/reports', reportRoutes);
v1.use('/reviews', reviewRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/platform-settings', platformSettingsRoutes);
v1.use('/admin', analyticsRoutes);
v1.use('/subscriptions', subscriptionRoutes);
v1.use('/dispatch', dispatchRoutes);
v1.use('/chat', chatRoutes);
v1.use('/wallet', walletRoutes);

app.use('/api/v1', v1);

// 404 + centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
