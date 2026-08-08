/**
 * Cash-on-delivery "gateway". No external calls — payment is collected
 * physically at delivery and marked PAID by the delivery boy/store on
 * successful handoff.
 */
async function createPayment({ amount }) {
  return { status: 'PENDING', providerReference: null, raw: { amount, method: 'COD' } };
}

async function verifyPayment() {
  return { status: 'PAID' };
}

async function refundPayment() {
  // No electronic refund possible for COD; handled operationally.
  return { status: 'REFUNDED' };
}

module.exports = { createPayment, verifyPayment, refundPayment };
