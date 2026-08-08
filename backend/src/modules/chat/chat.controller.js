const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const service = require('./chat.service');

const getOrderConversation = catchAsync(async (req, res) => {
  const conversation = await service.getOrCreateOrderConversation(req.params.orderId, req.user._id, req.user.role);
  ApiResponse.success(res, { message: 'Order conversation ready', data: conversation });
});

const getSupportConversation = catchAsync(async (req, res) => {
  const conversation = await service.getOrCreateSupportConversation(req.user._id, req.user.role, req.body.subject);
  ApiResponse.success(res, { message: 'Support conversation ready', data: conversation });
});

const listMyConversations = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMyConversations(req.user._id, req.user.role, req.query);
  ApiResponse.success(res, { message: 'Conversations fetched', data: items, meta });
});

const listMessages = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMessages(req.params.conversationId, req.user._id, req.user.role, req.query);
  ApiResponse.success(res, { message: 'Messages fetched', data: items.reverse(), meta });
});

const sendMessage = catchAsync(async (req, res) => {
  const message = await service.sendMessage(req.params.conversationId, req.user, req.body.content, req.body.attachments);
  ApiResponse.success(res, { statusCode: 201, message: 'Message sent', data: message });
});

const markRead = catchAsync(async (req, res) => {
  await service.markRead(req.params.conversationId, req.user._id, req.user.role);
  ApiResponse.success(res, { message: 'Marked as read' });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const count = await service.getUnreadCount(req.user._id);
  ApiResponse.success(res, { message: 'Unread count fetched', data: { count } });
});

module.exports = {
  getOrderConversation,
  getSupportConversation,
  listMyConversations,
  listMessages,
  sendMessage,
  markRead,
  getUnreadCount,
};
