const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.MONGO_URI);
    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
    await healLegacyIndexes();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

/**
 * Mongoose's autoIndex only ever *creates* indexes that are missing — it
 * never alters or drops an existing index whose options no longer match the
 * schema. Conversation.orderId was originally a plain unique index, then
 * later changed to `{ unique: true, sparse: true }` (so many SUPPORT
 * conversations, which have no orderId, can all coexist). Any database that
 * was ever run against the old schema still has the old, non-sparse index
 * sitting there, silently ignored by autoIndex — and it will keep rejecting
 * every second `orderId: null` document with a confusing E11000 error.
 *
 * This repairs that one known-bad index in place on every boot. It's cheap
 * (a no-op once fixed) and safe to leave running permanently, unlike a
 * blanket `Model.syncIndexes()` for every model, which could unexpectedly
 * drop indexes during a deploy where code and schema are momentarily out of
 * step.
 */
async function healLegacyIndexes() {
  try {
    const Conversation = require('../modules/chat/conversation.model');
    const existing = await Conversation.collection.indexes();
    const stale = existing.find((idx) => idx.name === 'orderId_1' && !idx.sparse);
    if (stale) {
      await Conversation.collection.dropIndex('orderId_1');
      // eslint-disable-next-line no-console
      console.warn('[db] Dropped legacy non-sparse orderId_1 index on conversations — rebuilding as sparse.');
    }
    await Conversation.syncIndexes();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] Failed to heal legacy conversation index (non-fatal):', err.message);
  }
}

module.exports = connectDB;
