const Notification = require('./notification.model');
const ApiError = require('../../utils/ApiError');
const { getPagination, paginate } = require('../../utils/pagination');
const { emitToUser } = require('../../sockets');

async function notify(userId, { type, title, message, referenceType, referenceId }) {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    referenceType,
    referenceId,
  });

  // Real-time push; falls back to in-app polling via listMine if the user is offline
  emitToUser(userId, 'notification:new', notification);

  return notification;
}

async function listMine(userId, query) {
  const pagination = getPagination(query);
  const filter = { userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
  return paginate(Notification, filter, pagination);
}

async function markAsRead(userId, id) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return notification;
}

async function markAllAsRead(userId) {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

module.exports = { notify, listMine, markAsRead, markAllAsRead };
