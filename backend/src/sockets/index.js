const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../modules/users/user.model');
const env = require('../config/env');

let ioInstance = null;

/**
 * Order-specific rooms: `order:{orderId}`.
 * Store/admin room: `store:{storeId}`.
 * Delivery boy personal room: `delivery:{deliveryBoyUserId}`.
 */
function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('-password');
      if (!user || !user.isActive) return next(new Error('Invalid session'));

      socket.user = user;
      return next();
    } catch (err) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;

    // Personal room for direct notifications
    socket.join(`user:${user._id}`);

    if (user.role === 'DELIVERY_BOY') {
      socket.join(`delivery:${user._id}`);
    }
    if (user.role === 'SHOP_OWNER' || user.role === 'SUPER_ADMIN') {
      socket.join(`store-owner:${user._id}`);
    }
    if (user.role === 'SUPER_ADMIN') {
      // Lets admin dashboards get a live ping whenever any support message
      // arrives, without needing to already have that conversation open.
      socket.join('support-queue');
      // Broadcast room for every order event (see emitOrderEvent below) so
      // admin screens — e.g. the manual dispatch/assign dashboard — update
      // live instead of needing a manual refresh after every order change.
      socket.join('admins');
    }

    // --- Unified chat (order chats + support) ---
    // Room membership is authorized against the Conversation's participant
    // list (or SUPER_ADMIN for SUPPORT conversations) before joining, so a
    // socket can't listen in on a conversation it isn't part of.
    socket.on('chat:join', async ({ conversationId }) => {
      if (!conversationId) return;
      try {
        // eslint-disable-next-line global-require
        const chatService = require('../modules/chat/chat.service');
        await chatService.getConversationById(conversationId, user._id, user.role);
        socket.join(`chat:${conversationId}`);
      } catch {
        // not a participant — silently refuse to join
      }
    });

    socket.on('chat:leave', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`chat:${conversationId}`);
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`chat:${conversationId}`).emit('chat:typing', { conversationId, userId: user._id, isTyping });
    });

    // Customer/store/admin joins an order-specific room to receive live updates
    socket.on('order:track', ({ orderId }) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
    });

    socket.on('order:untrack', ({ orderId }) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    // Delivery boy pushes GPS coordinates for an active order
    socket.on('delivery:location:update', ({ orderId, latitude, longitude }) => {
      if (user.role !== 'DELIVERY_BOY' || !orderId) return;
      io.to(`order:${orderId}`).emit('delivery:location', {
        orderId,
        deliveryBoyId: user._id,
        latitude,
        longitude,
      });
    });

    socket.on('delivery:status:update', ({ orderId, status }) => {
      if (user.role !== 'DELIVERY_BOY' || !orderId) return;
      io.to(`order:${orderId}`).emit('order:status', { orderId, status });
    });

    socket.on('disconnect', () => {
      // no-op; rooms are cleaned up automatically by socket.io
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.IO has not been initialized');
  return ioInstance;
}

/** Emit a generic order-related event to an order or store room. */
/**
 * Emits an order-related event to everyone who should see it live:
 *  - the `order:{orderId}` room (customer + anyone who called order:track —
 *    this now includes delivery dashboards, see chat/dispatch below)
 *  - the store owner's own personal room, `user:{ownerId}`
 *
 * `order` must have at least `_id` and `ownerId` — pass the actual order
 * document (or `{ _id, ownerId }`) rather than a bare string, since a
 * previous version of this function tried to target `store-owner:{orderId}`
 * which nobody ever joins (store owners join `store-owner:{userId}`, keyed
 * by their own id, not by any order's id) — that made every order-status
 * push to shop owners silently go nowhere.
 */
function emitOrderEvent(event, order, payload) {
  if (!ioInstance) return; // sockets may not be initialized in test environments
  const orderId = typeof order === 'string' ? order : order._id;
  ioInstance.to(`order:${orderId}`).emit(event, payload);
  if (order && order.ownerId) {
    ioInstance.to(`user:${order.ownerId}`).emit(event, payload);
  }
  // Every order event also reaches admin dashboards (see the `admins` room
  // join above) — previously admins had no room targeted here at all, so
  // e.g. the manual dispatch/assign screen never learned an order changed
  // status until it was manually refreshed.
  ioInstance.to('admins').emit(event, payload);
}

/** Emit a notification directly to a specific user. */
function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSockets, getIO, emitOrderEvent, emitToUser };
