const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./cart.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Cart
 */

const getCart = catchAsync(async (req, res) => {
  const { cart, subtotal } = await service.getCartWithTotals(req.user._id);
  ApiResponse.success(res, { message: 'Cart fetched', data: { cart, subtotal } });
});

const addItem = catchAsync(async (req, res) => {
  const result = await service.addItem(req.user._id, req.body);
  if (result.conflict) {
    return ApiResponse.success(res, {
      statusCode: 200,
      message: result.message,
      data: { conflict: true },
    });
  }
  ApiResponse.success(res, {
    statusCode: 201,
    message: 'Item added to cart',
    data: { cart: result.cart, subtotal: result.subtotal },
  });
});

const updateItem = catchAsync(async (req, res) => {
  const { cart, subtotal } = await service.updateItemQuantity(req.user._id, req.params.itemId, req.body.quantity);
  ApiResponse.success(res, { message: 'Cart updated', data: { cart, subtotal } });
});

const removeItem = catchAsync(async (req, res) => {
  const { cart, subtotal } = await service.removeItem(req.user._id, req.params.itemId);
  ApiResponse.success(res, { message: 'Item removed from cart', data: { cart, subtotal } });
});

const clearCart = catchAsync(async (req, res) => {
  const { cart, subtotal } = await service.clearCart(req.user._id);
  ApiResponse.success(res, { message: 'Cart cleared', data: { cart, subtotal } });
});

router.use(authenticate, requireRole('CUSTOMER'));
router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:itemId', updateItem);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

module.exports = router;
