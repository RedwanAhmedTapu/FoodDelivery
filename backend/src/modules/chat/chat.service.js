const Conversation = require('./conversation.model');
const Message = require('./message.model');
const Order = require('../orders/order.model');
const DeliveryBoy = require('../delivery/deliveryBoy.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { getPagination, paginate } = require('../../utils/pagination');
const { emitToUser } = require('../../sockets');

function isParticipant(conversation, userId, userRole) {
  if (userRole === 'SUPER_ADMIN' && conversation.type === 'SUPPORT') return true;
  return conversation.participants.some((p) => p.userId.toString() === userId.toString());
}

/**
 * Gets (or creates) the chat for a specific order. Participants are derived
 * from the order itself: the customer, the store owner, and — once
 * assigned — the delivery rider. Re-derives participants on each call so a
 * newly-assigned rider is automatically added to an already-open chat.
 */
async function getOrCreateOrderConversation(orderId, requesterId, requesterRole) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const participants = [
    { userId: order.customerId, role: 'CUSTOMER' },
    { userId: order.ownerId, role: 'SHOP_OWNER' },
  ];

  if (order.deliveryBoyId) {
    const rider = await DeliveryBoy.findById(order.deliveryBoyId);
    if (rider) participants.push({ userId: rider.userId, role: 'DELIVERY_BOY' });
  }

  const allowed =
    requesterRole === 'SUPER_ADMIN' ||
    participants.some((p) => p.userId.toString() === requesterId.toString());
  if (!allowed) throw ApiError.forbidden('You are not part of this order');

  let conversation = await Conversation.findOne({ orderId, type: 'ORDER' });
  if (!conversation) {
    conversation = await Conversation.create({ type: 'ORDER', orderId, participants });
  } else {
    // Keep participants in sync (e.g. rider just got assigned)
    const existingIds = new Set(conversation.participants.map((p) => p.userId.toString()));
    const newOnes = participants.filter((p) => !existingIds.has(p.userId.toString()));
    if (newOnes.length) {
      conversation.participants.push(...newOnes);
      await conversation.save();
    }
  }

  return conversation;
}

/** Opens (or reuses) this user's support conversation with admin. */
async function getOrCreateSupportConversation(userId, userRole, subject) {
  let conversation = await Conversation.findOne({
    type: 'SUPPORT',
    'participants.userId': userId,
    isClosed: false,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'SUPPORT',
      participants: [{ userId, role: userRole }],
      subject: subject || 'Support request',
    });
  }

  return conversation;
}

async function listMyConversations(userId, userRole, query) {
  const pagination = getPagination(query);
  const filter =
    userRole === 'SUPER_ADMIN' && query.scope === 'support'
      ? { type: 'SUPPORT' } // admin sees the whole support queue
      : { 'participants.userId': userId };

  return paginate(Conversation, filter, pagination, {
    sort: { lastMessageAt: -1 },
    populate: [{ path: 'orderId', select: 'orderNumber orderStatus' }],
  });
}

async function getConversationById(conversationId, userId, userRole) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(conversation, userId, userRole)) {
    throw ApiError.forbidden('You are not part of this conversation');
  }
  return conversation;
}

async function listMessages(conversationId, userId, userRole, query) {
  await getConversationById(conversationId, userId, userRole);
  const pagination = getPagination({ ...query, limit: query.limit || 50 });
  return paginate(Message, { conversationId }, pagination, { sort: { createdAt: -1 } });
}

async function sendMessage(conversationId, sender, content, attachments = []) {
  const conversation = await getConversationById(conversationId, sender._id, sender.role);
  if (conversation.isClosed) throw ApiError.badRequest('This conversation is closed');

  const message = await Message.create({
    conversationId,
    senderId: sender._id,
    senderRole: sender.role,
    content,
    attachments,
    readBy: [sender._id],
  });

  conversation.lastMessageAt = new Date();
  conversation.lastMessagePreview = content.slice(0, 120);
  await conversation.save();

  // Push to everyone who has this conversation's room open live...
  const { getIO } = require('../../sockets');
  try {
    getIO().to(`chat:${conversationId}`).emit('chat:message', { conversationId, message });
  } catch {
    // sockets not initialized (e.g. tests) — safe to ignore
  }

  // ...and also to each other participant's personal room, so they get a
  // notification even if they don't currently have the chat window open.
  const recipients = conversation.participants.filter((p) => p.userId.toString() !== sender._id.toString());
  recipients.forEach((p) => emitToUser(p.userId, 'chat:message', { conversationId, message }));
  if (conversation.type === 'SUPPORT') {
    try {
      getIO().to('support-queue').emit('chat:message', { conversationId, message });
    } catch {
      // sockets not initialized (e.g. tests) — safe to ignore
    }
  }

  return message;
}

async function markRead(conversationId, userId, userRole) {
  await getConversationById(conversationId, userId, userRole);
  await Message.updateMany(
    { conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
}

async function getUnreadCount(userId) {
  const conversations = await Conversation.find({ 'participants.userId': userId }).select('_id');
  const ids = conversations.map((c) => c._id);
  return Message.countDocuments({
    conversationId: { $in: ids },
    senderId: { $ne: userId },
    readBy: { $ne: userId },
  });
}

module.exports = {
  getOrCreateOrderConversation,
  getOrCreateSupportConversation,
  listMyConversations,
  getConversationById,
  listMessages,
  sendMessage,
  markRead,
  getUnreadCount,
  isParticipant,
};
