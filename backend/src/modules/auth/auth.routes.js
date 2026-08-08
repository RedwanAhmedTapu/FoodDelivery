const router = require('express').Router();
const controller = require('./auth.controller');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('./auth.validation');

/**
 * Tag: Auth
 */

router.post('/register/customer', validate({ body: registerSchema }), controller.registerCustomer);
router.post('/register/shop-owner', validate({ body: registerSchema }), controller.registerShopOwner);
router.post('/register/delivery-boy', validate({ body: registerSchema }), controller.registerDeliveryBoy);

router.post('/login', validate({ body: loginSchema }), controller.login);
router.post('/refresh-token', validate({ body: refreshSchema }), controller.refresh);
router.post('/logout', authenticate, controller.logout);

router.post('/forgot-password', validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), controller.resetPassword);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  controller.changePassword
);

module.exports = router;
