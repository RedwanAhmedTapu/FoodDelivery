const router = require('express').Router();
const controller = require('./chat.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * Tag: Chat
 */

router.use(authenticate);

router.get('/conversations', controller.listMyConversations);
router.get('/conversations/unread-count', controller.getUnreadCount);
router.get('/conversations/order/:orderId', controller.getOrderConversation);
router.post('/conversations/support', controller.getSupportConversation);
router.get('/conversations/:conversationId/messages', controller.listMessages);
router.post('/conversations/:conversationId/messages', controller.sendMessage);
router.patch('/conversations/:conversationId/read', controller.markRead);

module.exports = router;
