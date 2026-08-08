'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/lib/endpoints/misc';
import { Notification } from '@/types';
import { getSocket } from '@/lib/socket';
import { Spinner } from '@/components/ui/Primitives';
import { cn, formatDate } from '@/lib/utils';

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initial unread count on mount, so the badge shows up without opening the panel.
  useEffect(() => {
    notificationsApi
      .list({ isRead: 'false', limit: 1 })
      .then(({ meta }) => setUnreadCount(meta.total))
      .catch(() => {});
  }, []);

  // Live push: new notifications (order accepted, rider assigned, delivery
  // OTP ready, etc.) show up instantly instead of requiring a page refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNew = (notification: Notification) => {
      setItems((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  function loadList() {
    setIsLoading(true);
    notificationsApi
      .list({ limit: 20 })
      .then(({ items: fetched }) => {
        setItems(fetched);
        setHasLoadedOnce(true);
      })
      .finally(() => setIsLoading(false));
  }

  function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !hasLoadedOnce) loadList();
  }

  async function markRead(notification: Notification) {
    if (notification.isRead) return;
    setItems((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsApi.markRead(notification._id);
    } catch {
      // best-effort; a stale isRead flag isn't worth bothering the user about
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      // best-effort
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggleOpen}
        className="relative rounded-lg border border-border p-2.5 text-muted hover:border-mango hover:text-paper"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold text-paper">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-ticket">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-medium text-paper">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-mango hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-faint">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => markRead(n)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-surface',
                    !n.isRead && 'bg-mango-soft/40'
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />}
                    <p className="text-sm font-medium text-paper">{n.title}</p>
                  </div>
                  <p className="text-xs text-muted">{n.message}</p>
                  <p className="text-[10px] text-faint">{formatDate(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
