'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '@/types';
import { chatApi } from '@/lib/endpoints/chat';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { Spinner } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';

export function ChatThread({ conversationId }: { conversationId: string }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    chatApi
      .listMessages(conversationId)
      .then(({ items }) => setMessages(items))
      .finally(() => setIsLoading(false));
    chatApi.markRead(conversationId).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat:join', { conversationId });

    const onMessage = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId !== conversationId) return;
      // The sender is also a member of this socket room, so a message they
      // just sent arrives back here as an echo on top of the optimistic
      // local append below — dedupe by _id so it doesn't show twice.
      setMessages((prev) => (prev.some((m) => m._id === payload.message._id) ? prev : [...prev, payload.message]));
      chatApi.markRead(conversationId).catch(() => {});
    };

    socket.on('chat:message', onMessage);
    return () => {
      socket.emit('chat:leave', { conversationId });
      socket.off('chat:message', onMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    const content = draft;
    setDraft('');
    try {
      const message = await chatApi.sendMessage(conversationId, content);
      setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    } catch {
      setDraft(content); // restore on failure so the user doesn't lose their message
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-faint">Say hello — messages appear here in real time.</p>
        ) : (
          <div className="space-y-2.5">
            {messages.map((m) => {
              const isMine = m.senderId === user?._id;
              return (
                <div key={m._id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                      isMine ? 'bg-mango text-base' : 'bg-surface text-paper'
                    )}
                  >
                    {!isMine && <p className="mb-0.5 text-[10px] font-medium uppercase text-faint">{m.senderRole}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-paper placeholder:text-faint focus:border-mango focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mango text-base disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
