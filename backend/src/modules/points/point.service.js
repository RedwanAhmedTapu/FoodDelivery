const PointTransaction = require('./pointTransaction.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const runTransaction = require('../../utils/runTransaction');
const { getPagination, paginate } = require('../../utils/pagination');

/**
 * Apply a point transaction atomically within a given session (or standalone).
 * `points` should be positive for credit, negative for debit.
 */
async function applyPointTransaction(
  { userId, type, points, referenceType, referenceId, description },
  session = null
) {
  const opts = session ? { session } : {};
  const user = await User.findById(userId, null, opts);
  if (!user) throw ApiError.notFound('User not found');

  const balanceBefore = user.pointsBalance;
  const balanceAfter = balanceBefore + points;

  if (balanceAfter < 0) {
    throw ApiError.badRequest('Insufficient points balance');
  }

  user.pointsBalance = balanceAfter;
  await user.save(opts);

  const [txn] = await PointTransaction.create(
    [
      {
        userId,
        type,
        points,
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId,
        description,
      },
    ],
    opts
  );

  return txn;
}

async function getBalance(userId) {
  const user = await User.findById(userId).select('pointsBalance');
  if (!user) throw ApiError.notFound('User not found');
  return user.pointsBalance;
}

async function getHistory(userId, query) {
  const pagination = getPagination(query);
  const filter = { userId };
  if (query.type) filter.type = query.type;
  return paginate(PointTransaction, filter, pagination);
}

async function adminAdjustPoints(userId, points, description) {
  return runTransaction((session) =>
    applyPointTransaction(
      { userId, type: 'ADMIN_ADJUSTMENT', points, description: description || 'Manual admin adjustment' },
      session
    )
  );
}

module.exports = { applyPointTransaction, getBalance, getHistory, adminAdjustPoints };
