const Payment = require('./payment.model');
const Order = require('../orders/order.model');
const ApiError = require('../../utils/ApiError');
const codGateway = require('./gateways/cod.gateway');
const { buildStubGateway } = require('./gateways/stub.gateway');
const sslcommerzGateway = require('./gateways/sslcommerz.gateway');

const gateways = {
  COD: codGateway,
  SSLCOMMERZ: sslcommerzGateway, // ✅ fixed — was buildStubGateway('SSLCOMMERZ')
  BKASH: buildStubGateway('BKASH'),
  NAGAD: buildStubGateway('NAGAD'),
  STRIPE: buildStubGateway('STRIPE'),
};

function resolveGateway(provider) {
  const gateway = gateways[provider];
  if (!gateway) throw ApiError.badRequest(`Unsupported payment provider: ${provider}`);
  return gateway;
}

async function createPayment(orderId, customerId, provider) {
  const order = await Order.findById(orderId).populate('customerId');
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customerId._id.toString() !== customerId.toString()) {
    throw ApiError.forbidden('You do not own this order');
  }

  const gateway = resolveGateway(provider);
  const result = await gateway.createPayment({
    amount: order.total,
    orderId: order._id.toString(),
    customer: {
      name: order.customerId.name,
      email: order.customerId.email,
      phone: order.customerId.phone,
    },
  });

  const payment = await Payment.create({
    purpose: 'ORDER',
    orderId: order._id,
    customerId,
    provider,
    amount: order.total,
    status: result.status,
    providerReference: result.providerReference,
    metadata: result.raw || {},
  });

  return payment;
}

async function verifyPayment(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');

  const gateway = resolveGateway(payment.provider);
  const result = await gateway.verifyPayment({ providerReference: payment.providerReference });

  payment.status = result.status;
  await payment.save();

  if (result.status === 'PAID') {
    await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'PAID' });
  }

  return payment;
}

async function refundPayment(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== 'PAID') throw ApiError.badRequest('Only paid payments can be refunded');

  const gateway = resolveGateway(payment.provider);
  const result = await gateway.refundPayment({
    providerReference: payment.providerReference,
    amount: payment.amount,
    bankTranId: payment.metadata?.bank_tran_id,
  });

  payment.status = result.status;
  await payment.save();

  if (result.status === 'REFUNDED') {
    await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'REFUNDED' });
  }

  return payment;
}

async function getPaymentsForOrder(orderId) {
  return Payment.find({ orderId }).sort({ createdAt: -1 });
}

// ✅ added — was missing, but referenced by payment.routes.js (sslSuccess/sslIpn)
async function confirmSslcommerzPayment(tranId, valId) {
  const payment = await Payment.findOne({ providerReference: tranId });
  if (!payment) throw ApiError.notFound('Payment not found for this transaction');

  const gateway = resolveGateway('SSLCOMMERZ');
  const result = await gateway.verifyPayment({ providerReference: tranId, valId });

  payment.status = result.status;
  payment.metadata = { ...payment.metadata, ...result.raw };
  await payment.save();

  if (result.status === 'PAID') {
    if (payment.purpose === 'SUBSCRIPTION') {
      // require() here (not top-level) to avoid a circular require, since
      // subscription.service.js also requires this file's sibling gateway
      // module but never payment.service.js itself.
      const subscriptionService = require('../subscriptions/subscription.service');
      await subscriptionService.activateFromPayment(payment);
    } else {
      await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'PAID' });
    }
  }

  return payment;
}

module.exports = {
  createPayment,
  verifyPayment,
  refundPayment,
  getPaymentsForOrder,
  confirmSslcommerzPayment,
};