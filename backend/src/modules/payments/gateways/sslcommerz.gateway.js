const axios = require('axios');
const env = require('../../../config/env');
const ApiError = require('../../../utils/ApiError');

const BASE = env.SSLCOMMERZ_IS_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

function auth() {
  return {
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
  };
}

const sslcommerzGateway = {
  // `refId` is the Order._id for order payments or the StoreSubscription._id
  // for subscription payments. `prefix` tags the tran_id so the frontend's
  // /payment/success page and our IPN handler both know which flow this is
  // (`SSL-` = order payment, `SUBSCR-` = store subscription payment).
  async createPayment({ amount, orderId, refId, prefix = 'SSL', productLabel = 'Order', customer = {} }) {
    const reference = refId || orderId;
    const payload = {
      ...auth(),
      total_amount: amount,
      currency: 'BDT',
      tran_id: `${prefix}-${reference}-${Date.now()}`, // must be unique — this is your providerReference
      success_url: env.SSLCOMMERZ_SUCCESS_URL,
      fail_url: env.SSLCOMMERZ_FAIL_URL,
      cancel_url: env.SSLCOMMERZ_CANCEL_URL,
      ipn_url: env.SSLCOMMERZ_IPN_URL,
      shipping_method: 'NO',
      product_name: `${productLabel} ${reference}`,
      product_category: prefix === 'SUBSCR' ? 'Subscription' : 'Food',
      product_profile: 'general',
      cus_name: customer.name || 'Customer',
      cus_email: customer.email || 'customer@example.com',
      cus_add1: customer.address || 'N/A',
      cus_phone: customer.phone || '01700000000',
      cus_city: customer.city || 'Dhaka',
      cus_country: 'Bangladesh',
    };

    const { data } = await axios.post(
      `${BASE}/gwprocess/v4/api.php`,
      new URLSearchParams(payload).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (data.status !== 'SUCCESS') {
      throw ApiError.badRequest(data.failedreason || 'Failed to initiate SSLCommerz session');
    }

    return {
      status: 'PENDING',
      providerReference: payload.tran_id,
      raw: { gatewayPageURL: data.GatewayPageURL, sessionkey: data.sessionkey },
    };
  },

  // Called by our IPN/success route with val_id, or by manual re-check using tran_id
  async verifyPayment({ providerReference, valId }) {
    if (!valId) {
      // No val_id yet means we can't validate against SSLCommerz — still pending
      return { status: 'PENDING', note: 'Awaiting SSLCommerz callback' };
    }

    const { data } = await axios.get(`${BASE}/validator/api/validationserverAPI.php`, {
      params: { val_id: valId, ...auth(), format: 'json' },
    });

    const isValid =
      (data.status === 'VALID' || data.status === 'VALIDATED') &&
      data.tran_id === providerReference;

    return {
      status: isValid ? 'PAID' : 'FAILED',
      raw: data,
    };
  },

  async refundPayment({ providerReference, amount, bankTranId }) {
    if (!bankTranId) {
      throw ApiError.badRequest('bank_tran_id is required to refund an SSLCommerz payment');
    }

    const { data } = await axios.post(
      `${BASE}/validator/api/merchantTransIDvalidationAPI.php`,
      new URLSearchParams({
        ...auth(),
        bank_tran_id: bankTranId,
        refund_amount: amount,
        refund_remarks: 'Customer refund',
        format: 'json',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return {
      status: data.status === 'success' ? 'REFUNDED' : 'PENDING',
      raw: data,
    };
  },
};

module.exports = sslcommerzGateway;