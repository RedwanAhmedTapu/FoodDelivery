'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, RefreshCw, Search } from 'lucide-react';
import { ordersApi } from '@/lib/endpoints/orders';
import { dispatchApi } from '@/lib/endpoints/dispatch';
import { chatApi } from '@/lib/endpoints/chat';
import { Order, OrderStatus } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { formatCurrency, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { useChatUiStore } from '@/store/useChatUiStore';
import { getSocket } from '@/lib/socket';

const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; status: OrderStatus; variant: 'primary' | 'danger' }[]>> = {
  PENDING: [
    { label: 'Accept', status: 'ACCEPTED', variant: 'primary' },
    { label: 'Reject', status: 'REJECTED', variant: 'danger' },
  ],
  ACCEPTED: [{ label: 'Start preparing', status: 'PREPARING', variant: 'primary' }],
  PREPARING: [{ label: 'Mark ready for pickup', status: 'READY_FOR_PICKUP', variant: 'primary' }],
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [verifyingPinFor, setVerifyingPinFor] = useState<string | null>(null);
  const openChat = useChatUiStore((s) => s.open);

  function load() {
    ordersApi
      .storeOrders({ limit: 50 })
      .then(({ items }) => setOrders(items))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  // Real-time updates. Every socket auto-joins `user:{ownerId}` on connect,
  // and the backend now correctly targets that room for order events (see
  // sockets/index.js emitOrderEvent) — so no explicit room-joining needed
  // here, just listening. Previously these pages had no listeners at all,
  // so a new order, a rider accepting an offer, etc. never appeared without
  // a manual page refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewOrder = (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success(`New order: ${order.orderNumber}`);
    };
    const onStatus = (payload: { orderId: string; status: OrderStatus }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === payload.orderId ? { ...o, orderStatus: payload.status } : o))
      );
    };
    const onDispatchFailed = (payload: { orderId: string; message: string }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === payload.orderId ? { ...o, dispatchStatus: 'FAILED' } : o))
      );
      toast.error(payload.message);
    };

    socket.on('order:new', onNewOrder);
    socket.on('order:status', onStatus);
    socket.on('dispatch:failed', onDispatchFailed);

    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('order:status', onStatus);
      socket.off('dispatch:failed', onDispatchFailed);
    };
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      const updated = await ordersApi.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success(`Order ${ORDER_STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function verifyPickup(order: Order) {
    const pin = pinDrafts[order._id];
    if (!pin) return toast.error("Ask the rider for their pickup PIN");

    setVerifyingPinFor(order._id);
    try {
      const updated = await dispatchApi.verifyPickupPin(order._id, pin);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success('Pickup verified — order handed off');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Incorrect PIN'));
    } finally {
      setVerifyingPinFor(null);
    }
  }

  async function retryDispatch(orderId: string) {
    try {
      await dispatchApi.retryDispatch(orderId);
      toast.success('Searching for a rider again...');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function openOrderChat(orderId: string) {
    try {
      const conversation = await chatApi.getOrderConversation(orderId);
      openChat(conversation._id);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" description="Orders placed at your stores will show up here." />;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order._id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-faint">{order.orderNumber}</p>
              <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openOrderChat(order._id)}
                className="rounded-full border border-border p-2 text-muted hover:border-mango hover:text-mango"
                aria-label="Chat"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <Badge variant="mango">{ORDER_STATUS_LABEL[order.orderStatus]}</Badge>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-muted">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span className="font-mono">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {order.orderStatus === 'READY_FOR_PICKUP' && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Search className="h-4 w-4 animate-pulse text-mango" />
                {order.dispatchStatus === 'FAILED' ? 'No riders found nearby' : 'Searching for a nearby rider...'}
              </span>
              {order.dispatchStatus === 'FAILED' && (
                <Button size="sm" variant="outline" onClick={() => retryDispatch(order._id)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
              )}
            </div>
          )}

          {order.orderStatus === 'ASSIGNED_TO_DELIVERY' && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Enter rider's pickup PIN"
                value={pinDrafts[order._id] || ''}
                onChange={(e) => setPinDrafts((prev) => ({ ...prev, [order._id]: e.target.value }))}
                className="flex-1"
              />
              <Button size="sm" isLoading={verifyingPinFor === order._id} onClick={() => verifyPickup(order)}>
                Verify pickup
              </Button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-mono font-semibold text-paper">{formatCurrency(order.total)}</span>
            <div className="flex gap-2">
              {NEXT_ACTIONS[order.orderStatus]?.map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  variant={action.variant}
                  onClick={() => updateStatus(order._id, action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
