const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./payment.service');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const env = require('../../config/env'); // ✅ fixed — was missing, sslSuccess/sslFail/sslCancel need this

/**
 * Tag: Payments
 */

const createPayment = catchAsync(async (req, res) => {
  const payment = await service.createPayment(req.body.orderId, req.user._id, req.body.provider);
  ApiResponse.success(res, { statusCode: 201, message: 'Payment initiated', data: payment });
});

const verifyPayment = catchAsync(async (req, res) => {
  const payment = await service.verifyPayment(req.params.id);
  ApiResponse.success(res, { message: 'Payment verified', data: payment });
});

const refundPayment = catchAsync(async (req, res) => {
  const payment = await service.refundPayment(req.params.id);
  ApiResponse.success(res, { message: 'Payment refunded', data: payment });
});

const getPaymentsForOrder = catchAsync(async (req, res) => {
  const payments = await service.getPaymentsForOrder(req.params.orderId);
  ApiResponse.success(res, { message: 'Payments fetched', data: payments });
});

// SSLCommerz callbacks — no auth, form-encoded body from SSLCommerz's servers
const sslSuccess = catchAsync(async (req, res) => {
  const { tran_id, val_id } = req.body;
  await service.confirmSslcommerzPayment(tran_id, val_id);
  res.redirect(`${env.CLIENT_URL}/payment/success?tran_id=${tran_id}`);
});

const sslFail = catchAsync(async (req, res) => {
  const { tran_id } = req.body;
  res.redirect(`${env.CLIENT_URL}/payment/failure?tran_id=${tran_id || ''}`);
});

const sslCancel = catchAsync(async (req, res) => {
  const { tran_id } = req.body;
  res.redirect(`${env.CLIENT_URL}/payment/cancel?tran_id=${tran_id || ''}`);
});

const sslIpn = catchAsync(async (req, res) => {
  const { tran_id, val_id, status } = req.body;
  if (status === 'VALID' || status === 'VALIDATED') {
    await service.confirmSslcommerzPayment(tran_id, val_id);
  }
  res.sendStatus(200); // SSLCommerz শুধু 200 চায়
});

// SSLCommerz callbacks — must be registered BEFORE router.use(authenticate)
router.post('/sslcommerz/success', sslSuccess);
router.post('/sslcommerz/fail', sslFail);
router.post('/sslcommerz/cancel', sslCancel);
router.post('/sslcommerz/ipn', sslIpn);

router.use(authenticate);
router.post('/', requireRole('CUSTOMER'), createPayment);
router.post('/:id/verify', requireRole('CUSTOMER', 'SUPER_ADMIN'), verifyPayment);
router.post('/:id/refund', requireRole('SUPER_ADMIN', 'SHOP_OWNER'), refundPayment);
router.get('/order/:orderId', getPaymentsForOrder);

module.exports = router;