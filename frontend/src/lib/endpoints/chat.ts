import { api } from '@/lib/api';
import { ChatMessage, Conversation, PaginationMeta } from '@/types';

export const chatApi = {
  listMyConversations: (params: Record<string, string | number | undefined> = {}) =>
    api
      .get('/chat/conversations', { params })
      .then((res) => ({ items: res.data.data as Conversation[], meta: res.data.meta as PaginationMeta })),

  getUnreadCount: () =>
    api.get('/chat/conversations/unread-count').then((res) => res.data.data.count as number),

  getOrderConversation: (orderId: string) =>
    api.get(`/chat/conversations/order/${orderId}`).then((res) => res.data.data as Conversation),

  openSupportConversation: (subject?: string) =>
    api.post('/chat/conversations/support', { subject }).then((res) => res.data.data as Conversation),

  listMessages: (conversationId: string, params: Record<string, string | number | undefined> = {}) =>
    api
      .get(`/chat/conversations/${conversationId}/messages`, { params })
      .then((res) => ({ items: res.data.data as ChatMessage[], meta: res.data.meta as PaginationMeta })),

  sendMessage: (conversationId: string, content: string) =>
    api
      .post(`/chat/conversations/${conversationId}/messages`, { content })
      .then((res) => res.data.data as ChatMessage),

  markRead: (conversationId: string) => api.patch(`/chat/conversations/${conversationId}/read`),
};
