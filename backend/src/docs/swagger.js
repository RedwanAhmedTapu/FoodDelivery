const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Multi-Vendor Food Delivery Platform API',
    version: '1.0.0',
    description:
      'Production backend API for a multi-vendor food delivery platform: multi-store shop owners, ' +
      'store customization, points/referral system, delivery management, and live tracking.',
  },
  servers: [{ url: '/api/v1', description: 'Base API path' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Invalid request' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Admin' },
    { name: 'Shop Owners' },
    { name: 'Stores' },
    { name: 'Store Customization' },
    { name: 'Categories' },
    { name: 'Foods' },
    { name: 'Bulk Upload' },
    { name: 'Cart' },
    { name: 'Orders' },
    { name: 'Payments' },
    { name: 'Points' },
    { name: 'Referrals' },
    { name: 'Recommendations' },
    { name: 'Delivery' },
    { name: 'Tracking' },
    { name: 'Reports' },
    { name: 'Reviews' },
    { name: 'Notifications' },
    { name: 'Platform Settings' },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, '../modules/**/*.routes.js')],
};

module.exports = swaggerJSDoc(options);
