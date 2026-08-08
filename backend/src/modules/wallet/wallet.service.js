const Wallet = require('./wallet.model');
const WalletTransaction = require('./walletTransaction.model');
const PayoutRequest = require('./payoutRequest.model');
const CodRemittance = require('./codRemittance.model');
const ApiError = require('../../utils/ApiError');
const runTransaction = require('../../utils/runTransaction');
const { getPagination, paginate } = require('../../utils/pagination');

async function getOrCreateWallet(ownerType, ownerId, session = null) {
  const opts = session ? { session } : {};
  let wallet = await Wallet.findOne({ ownerType, ownerId }, null, opts);
  if (!wallet) {
    const created = await Wallet.create([{ ownerType, ownerId, balance: 0 }], opts);
    [wallet] = created;
  }
  return wallet;
}

/**
 * Move `amount` (always positive) in or out of a wallet and record a ledger
 * entry for it. Shop owner wallets can never go negative; delivery boy
 * wallets can — see wallet.model.js for why.
 */
async function applyWalletTransaction(
  { ownerType, ownerId, direction, amount, referenceType, referenceId, description },
  session = null
) {
  if (!amount || amount <= 0) throw ApiError.badRequest('Amount must be positive');
  const opts = session ? { session } : {};

  const wallet = await getOrCreateWallet(ownerType, ownerId, session);
  const balanceBefore = wallet.balance;
  const balanceAfter =
    Math.round((direction === 'CREDIT' ? balanceBefore + amount : balanceBefore - amount) * 100) / 100;

  if (direction === 'DEBIT' && balanceAfter < 0 && ownerType === 'SHOP_OWNER') {
    throw ApiError.badRequest('Insufficient wallet balance');
  }

  wallet.balance = balanceAfter;
  await wallet.save(opts);

  const [txn] = await WalletTransaction.create(
    [
      {
        walletId: wallet._id,
        ownerType,
        ownerId,
        type: direction,
        amount,
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId: referenceId || null,
        description: description || null,
      },
    ],
    opts
  );

  return { wallet, txn };
}

function credit(ownerType, ownerId, amount, meta, session = null) {
  return applyWalletTransaction({ ownerType, ownerId, direction: 'CREDIT', amount, ...meta }, session);
}

function debit(ownerType, ownerId, amount, meta, session = null) {
  return applyWalletTransaction({ ownerType, ownerId, direction: 'DEBIT', amount, ...meta }, session);
}

async function getSummary(ownerType, ownerId) {
  return getOrCreateWallet(ownerType, ownerId);
}

async function listTransactions(ownerType, ownerId, query) {
  const pagination = getPagination(query);
  const filter = { ownerType, ownerId };
  if (query.type) filter.type = query.type;
  return paginate(WalletTransaction, filter, pagination);
}

/**
 * Rider/store owner asks to cash out. Funds are reserved (debited) the
 * moment the request is made — not on admin approval — so the same balance
 * can never be requested twice while a payout is pending. If admin rejects
 * it later, the reservation is refunded (see processPayout).
 */
async function requestPayout(ownerType, ownerId, { amount, method, accountDetails }) {
  const parsedAmount = Number(amount);
  if (!parsedAmount || parsedAmount <= 0) throw ApiError.badRequest('Enter a valid amount');
  if (!['BANK', 'BKASH', 'NAGAD'].includes(method)) throw ApiError.badRequest('Invalid payout method');
  if (!accountDetails?.accountName || !accountDetails?.accountNumber) {
    throw ApiError.badRequest('Account name and number are required');
  }

  return runTransaction(async (session) => {
    const wallet = await getOrCreateWallet(ownerType, ownerId, session);
    if (wallet.balance < parsedAmount) throw ApiError.badRequest('Amount exceeds available balance');

    const { txn } = await debit(
      ownerType,
      ownerId,
      parsedAmount,
      { referenceType: 'PAYOUT', description: 'Payout requested — funds reserved' },
      session
    );

    const created = await PayoutRequest.create(
      [
        {
          walletId: wallet._id,
          ownerType,
          ownerId,
          amount: parsedAmount,
          method,
          accountDetails: {
            accountName: accountDetails.accountName,
            accountNumber: accountDetails.accountNumber,
            bankName: accountDetails.bankName || null,
          },
          status: 'PENDING',
          walletTransactionId: txn._id,
        },
      ],
      session ? { session } : {}
    );

    return created[0];
  });
}

async function listMyPayouts(ownerType, ownerId, query) {
  const pagination = getPagination(query);
  const filter = { ownerType, ownerId };
  if (query.status) filter.status = query.status;
  return paginate(PayoutRequest, filter, pagination);
}

async function listAllPayouts(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.ownerType) filter.ownerType = query.ownerType;
  return paginate(PayoutRequest, filter, pagination, {
    populate: [{ path: 'ownerId', select: 'name email phone' }],
  });
}

/** Admin marks a reserved payout as actually sent, or rejects it (refunding the hold). */
async function processPayout(payoutId, adminUserId, action, adminNote) {
  if (!['PAID', 'REJECTED'].includes(action)) throw ApiError.badRequest('Invalid action');

  const result = await runTransaction(async (session) => {
    const opts = session ? { session } : {};
    const payout = await PayoutRequest.findById(payoutId, null, opts);
    if (!payout) throw ApiError.notFound('Payout request not found');
    if (payout.status !== 'PENDING') throw ApiError.badRequest('This payout has already been processed');

    if (action === 'REJECTED') {
      // Refund the reserved amount back to the wallet.
      await credit(
        payout.ownerType,
        payout.ownerId,
        payout.amount,
        { referenceType: 'PAYOUT', referenceId: payout._id, description: 'Payout rejected — funds released' },
        session
      );
    }

    payout.status = action;
    payout.adminNote = adminNote || null;
    payout.processedAt = new Date();
    payout.processedBy = adminUserId;
    await payout.save(opts);

    return payout;
  });

  try {
    const notificationService = require('../notifications/notification.service'); // eslint-disable-line global-require
    await notificationService.notify(result.ownerId, {
      type: action === 'PAID' ? 'PAYOUT_PAID' : 'PAYOUT_REJECTED',
      title: action === 'PAID' ? 'Payout sent' : 'Payout rejected',
      message:
        action === 'PAID'
          ? `Your payout of ৳${result.amount} has been sent.`
          : `Your payout request of ৳${result.amount} was rejected${adminNote ? `: ${adminNote}` : '.'}`,
      referenceType: 'PayoutRequest',
      referenceId: result._id,
    });
  } catch (err) {
    // Notification failure should never roll back a completed payout.
  }

  return result;
}

/** Rider declares they've handed over/deposited COD cash they've been holding. */
async function submitCodRemittance(deliveryBoyUserId, { amount, method, reference }) {
  const parsedAmount = Number(amount);
  if (!parsedAmount || parsedAmount <= 0) throw ApiError.badRequest('Enter a valid amount');

  const wallet = await getOrCreateWallet('DELIVERY_BOY', deliveryBoyUserId);
  return CodRemittance.create({
    deliveryBoyUserId,
    walletId: wallet._id,
    amount: parsedAmount,
    method: method || 'CASH_HANDOVER',
    reference: reference || null,
    status: 'PENDING',
  });
}

async function listMyRemittances(deliveryBoyUserId, query) {
  const pagination = getPagination(query);
  const filter = { deliveryBoyUserId };
  if (query.status) filter.status = query.status;
  return paginate(CodRemittance, filter, pagination);
}

async function listAllRemittances(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  return paginate(CodRemittance, filter, pagination, {
    populate: [{ path: 'deliveryBoyUserId', select: 'name email phone' }],
  });
}

/** Admin confirms cash/mobile-banking was actually received — clears the rider's debt. */
async function confirmRemittance(remittanceId, adminUserId) {
  const remittance = await runTransaction(async (session) => {
    const opts = session ? { session } : {};
    const found = await CodRemittance.findById(remittanceId, null, opts);
    if (!found) throw ApiError.notFound('Remittance not found');
    if (found.status !== 'PENDING') throw ApiError.badRequest('This remittance has already been processed');

    await credit(
      'DELIVERY_BOY',
      found.deliveryBoyUserId,
      found.amount,
      { referenceType: 'COD_REMITTANCE', referenceId: found._id, description: 'COD cash remitted — debt cleared' },
      session
    );

    found.status = 'CONFIRMED';
    found.confirmedBy = adminUserId;
    found.confirmedAt = new Date();
    await found.save(opts);
    return found;
  });

  try {
    const notificationService = require('../notifications/notification.service'); // eslint-disable-line global-require
    await notificationService.notify(remittance.deliveryBoyUserId, {
      type: 'COD_REMITTANCE_CONFIRMED',
      title: 'COD remittance confirmed',
      message: `Your remittance of ৳${remittance.amount} has been confirmed and cleared from your balance.`,
      referenceType: 'CodRemittance',
      referenceId: remittance._id,
    });
  } catch (err) {
    // best-effort notification only
  }

  return remittance;
}

async function rejectRemittance(remittanceId, adminUserId, note) {
  const remittance = await CodRemittance.findById(remittanceId);
  if (!remittance) throw ApiError.notFound('Remittance not found');
  if (remittance.status !== 'PENDING') throw ApiError.badRequest('This remittance has already been processed');

  remittance.status = 'REJECTED';
  remittance.note = note || null;
  remittance.confirmedBy = adminUserId;
  remittance.confirmedAt = new Date();
  await remittance.save();

  try {
    const notificationService = require('../notifications/notification.service'); // eslint-disable-line global-require
    await notificationService.notify(remittance.deliveryBoyUserId, {
      type: 'COD_REMITTANCE_REJECTED',
      title: 'COD remittance rejected',
      message: `Your remittance of ৳${remittance.amount} was rejected${note ? `: ${note}` : '. Please re-submit with correct proof.'}`,
      referenceType: 'CodRemittance',
      referenceId: remittance._id,
    });
  } catch (err) {
    // best-effort notification only
  }

  return remittance;
}

/**
 * Credits the store owner and rider for a single completed order. Called
 * once, from order.service.onOrderDelivered, regardless of payment method —
 * the split math is identical either way, only *who currently holds the
 * cash* differs:
 *
 *  - Online (SSLCommerz etc.): the platform already holds the money, so
 *    both the store and the rider are simply credited their share.
 *  - COD: the rider is physically holding the full `order.total` in cash.
 *    They're credited their own delivery fee AND simultaneously debited the
 *    store+platform's share (since that cash in their pocket isn't theirs)
 *    — net effect on their wallet is negative until they remit that cash
 *    (see submitCodRemittance/confirmRemittance above). The store is
 *    credited immediately regardless, so its payout schedule never depends
 *    on chasing down individual riders for cash.
 *
 * storeShare + riderShare + platformFee always equals order.total — the
 * platform's own share (platformFee) is simply never paid out to anyone,
 * it stays as implicit platform revenue with no wallet of its own.
 */
async function settleOrderEarnings(order, deliveryBoyUserId) {
  return runTransaction(async (session) => {
    const storeShare =
      Math.round((order.subtotal + order.tax - order.discount - (order.pointDiscount || 0)) * 100) / 100;
    const riderShare = order.deliveryFee;

    await credit(
      'SHOP_OWNER',
      order.ownerId,
      storeShare,
      { referenceType: 'ORDER', referenceId: order._id, description: `Order ${order.orderNumber} settled` },
      session
    );

    if (!deliveryBoyUserId) return; // e.g. no rider on record — nothing more to settle

    await credit(
      'DELIVERY_BOY',
      deliveryBoyUserId,
      riderShare,
      { referenceType: 'ORDER', referenceId: order._id, description: `Delivery fee for order ${order.orderNumber}` },
      session
    );

    if (order.paymentMethod === 'COD') {
      const codHeldForOthers = Math.round((order.total - riderShare) * 100) / 100;
      if (codHeldForOthers > 0) {
        await debit(
          'DELIVERY_BOY',
          deliveryBoyUserId,
          codHeldForOthers,
          {
            referenceType: 'ORDER',
            referenceId: order._id,
            description: `COD cash collected for order ${order.orderNumber} — owed to store/platform`,
          },
          session
        );
      }
    }
  });
}

module.exports = {
  getOrCreateWallet,
  credit,
  debit,
  getSummary,
  listTransactions,
  requestPayout,
  listMyPayouts,
  listAllPayouts,
  processPayout,
  submitCodRemittance,
  listMyRemittances,
  listAllRemittances,
  confirmRemittance,
  rejectRemittance,
  settleOrderEarnings,
};
