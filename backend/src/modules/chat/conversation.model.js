const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Two kinds of conversation:
 *  - ORDER: scoped to one order, participants are whoever's actually
 *    involved (customer, the store's owner, the assigned rider). Created
 *    on demand the first time any of them opens the chat for that order.
 *  - SUPPORT: a user <-> admin conversation, not tied to any order. Any
 *    role (customer, shop owner, delivery boy) can open one; any
 *    SUPER_ADMIN can see and reply to the open support queue.
 */
const conversationSchema = new Schema(
  {
    type: { type: String, enum: ['ORDER', 'SUPPORT'], required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true },
      },
    ],
    subject: { type: String, default: null }, // support conversations only
    isClosed: { type: Boolean, default: false }, // support conversations only
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ orderId: 1 }, { unique: true, sparse: true });
conversationSchema.index({ 'participants.userId': 1, lastMessageAt: -1 });
conversationSchema.index({ type: 1, isClosed: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
