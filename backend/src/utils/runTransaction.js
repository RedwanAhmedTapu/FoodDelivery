const mongoose = require('mongoose');

let hasWarnedAboutStandalone = false;

/**
 * Runs `fn(session)` inside a MongoDB multi-document transaction when the
 * connected deployment supports them (a replica set or mongos — this
 * includes MongoDB Atlas, which is always at least a single-node replica
 * set). `fn` receives the session and should pass it to every
 * `.create()`/`.save()`/query call it makes so those operations join the
 * transaction.
 *
 * Standalone MongoDB instances — the default when you `mongod` locally
 * without `--replSet` — do NOT support transactions and raise:
 *   "Transaction numbers are only allowed on a replica set member or mongos"
 *
 * Rather than hard-failing local development over this, we catch that
 * specific error and re-run `fn(null)` without a session, so each write
 * still happens, just without atomicity/rollback guarantees. This keeps
 * local dev unblocked. Production should always run against a real
 * replica set so the transactional guarantees this code relies on
 * (e.g. order creation + point deduction + stock adjustment succeeding or
 * failing together) actually hold.
 */
async function runTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    const message = err?.message || '';
    const isStandaloneError =
      err?.code === 20 ||
      err?.codeName === 'IllegalOperation' ||
      message.includes('Transaction numbers are only allowed');

    if (!isStandaloneError) throw err;

    if (!hasWarnedAboutStandalone) {
      hasWarnedAboutStandalone = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[db] MongoDB transactions are not supported on this deployment (standalone instance, ' +
          'no replica set). Falling back to non-transactional writes for local development. ' +
          'This means related writes are no longer guaranteed to succeed/fail together — ' +
          'convert your local MongoDB to a single-node replica set, or use MongoDB Atlas, ' +
          'before deploying to production. See backend/README.md "Local MongoDB & transactions".'
      );
    }

    return fn(null);
  } finally {
    session.endSession();
  }
}

module.exports = runTransaction;
