'use client';

import { create } from 'zustand';

interface ChatUiState {
  isOpen: boolean;
  activeConversationId: string | null;
  unreadCount: number;
  open: (conversationId?: string) => void;
  close: () => void;
  setActiveConversation: (id: string | null) => void;
  setUnreadCount: (n: number) => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  isOpen: false,
  activeConversationId: null,
  unreadCount: 0,
  open: (conversationId) => set({ isOpen: true, activeConversationId: conversationId || null }),
  close: () => set({ isOpen: false }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setUnreadCount: (n) => set({ unreadCount: n }),
}));
