/**
 * Stub gateway. Replace with real SDK/API calls when integrating a live
 * provider. Keeping the same createPayment/verifyPayment/refundPayment
 * interface means PaymentService and the rest of the app never change.
 *
 * Example real integration points:
 *  - SSLCommerz: POST to their session API, redirect user, handle IPN webhook
 *  - bKash/Nagad: create payment -> execute payment -> query payment status
 *  - Stripe: create PaymentIntent, confirm client-side, handle webhook
 */
function buildStubGateway(providerName) {
  return {
    async createPayment({ amount, orderId }) {
      return {
        status: 'PENDING',
        providerReference: `${providerName}-${orderId}-${Date.now()}`,
        raw: { amount, provider: providerName, note: 'Stub gateway — integrate real SDK to go live' },
      };
    },
    async verifyPayment() {
      return { status: 'PENDING', note: 'Stub gateway — no real verification performed' };
    },
    async refundPayment() {
      return { status: 'PENDING', note: 'Stub gateway — no real refund performed' };
    },
  };
}

module.exports = { buildStubGateway };
