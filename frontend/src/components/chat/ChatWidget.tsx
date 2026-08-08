'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, X, ChevronLeft, LifeBuoy, Receipt } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatUiStore } from '@/store/useChatUiStore';
import { chatApi } from '@/lib/endpoints/chat';
import { Conversation } from '@/types';
import { ChatThread } from './ChatThread';
import { Spinner, EmptyState } from '@/components/ui/Primitives';
import { getSocket } from '@/lib/socket';
import { formatDate } from '@/lib/utils';

export function ChatWidget() {
  const { user } = useAuthStore();
  const { isOpen, activeConversationId, unreadCount, open, close, setActiveConversation, setUnreadCount } =
    useChatUiStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Poll unread count so the badge stays accurate even without the panel open.
  useEffect(() => {
    if (!user) return;
    const refresh = () => chatApi.getUnreadCount().then(setUnreadCount).catch(() => {});
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [user, setUnreadCount]);

  // Live-bump the badge the instant a message arrives anywhere.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onMessage = () => {
      chatApi.getUnreadCount().then(setUnreadCount).catch(() => {});
    };
    socket.on('chat:message', onMessage);
    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [setUnreadCount]);

  useEffect(() => {
    if (!isOpen || activeConversationId) return;
    setIsLoading(true);
    chatApi
      .listMyConversations({ limit: 30 })
      .then(({ items }) => setConversations(items))
      .finally(() => setIsLoading(false));
  }, [isOpen, activeConversationId]);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => (isOpen ? close() : open())}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-mango text-base shadow-ticket transition-transform hover:scale-105"
        aria-label="Open chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold text-paper">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-ticket">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            {activeConversationId && (
              <button onClick={() => setActiveConversation(null)} aria-label="Back">
                <ChevronLeft className="h-4 w-4 text-muted" />
              </button>
            )}
            <p className="font-display text-sm text-paper">
              {activeConversationId ? 'Conversation' : 'Messages'}
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeConversationId ? (
              <ChatThread conversationId={activeConversationId} />
            ) : (
              <ConversationList
                conversations={conversations}
                isLoading={isLoading}
                onSelect={(id) => setActiveConversation(id)}
                onOpenSupport={async () => {
                  const conv = await chatApi.openSupportConversation();
                  setActiveConversation(conv._id);
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ConversationList({
  conversations,
  isLoading,
  onSelect,
  onOpenSupport,
}: {
  conversations: Conversation[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onOpenSupport: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <button
          onClick={onOpenSupport}
          className="flex w-full items-center gap-2 rounded-xl border border-mango/30 bg-mango-soft px-3.5 py-2.5 text-sm text-mango"
        >
          <LifeBuoy className="h-4 w-4" /> Contact support
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState title="No conversations yet" description="Order chats and support requests show up here." />
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => {
              const order = typeof c.orderId === 'object' ? c.orderId : null;
              return (
                <button
                  key={c._id}
                  onClick={() => onSelect(c._id)}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-surface"
                >
                  {c.type === 'SUPPORT' ? (
                    <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-mango" />
                  ) : (
                    <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-mango" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-paper">
                      {c.type === 'SUPPORT' ? c.subject || 'Support' : order ? `Order ${order.orderNumber}` : 'Order chat'}
                    </p>
                    {c.lastMessagePreview && (
                      <p className="truncate text-xs text-faint">{c.lastMessagePreview}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-faint">{formatDate(c.lastMessageAt)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
