'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Radio, Star, Store as StoreIcon, KeyRound, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/endpoints/orders';
import { reviewsApi } from '@/lib/endpoints/misc';
import { chatApi } from '@/lib/endpoints/chat';
import { Order, Store } from '@/types';
import { AuthGate } from '@/lib/useRequireAuth';
import { getSocket } from '@/lib/socket';
import { OrderStatusStepper } from '@/components/order/OrderStatusStepper';
import { Card, Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatCurrency, formatDate, haversineDistanceMeters } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { useChatUiStore } from '@/store/useChatUiStore';

// Leaflet touches `window` on import, so it must never be part of the
// server-rendered bundle — load it client-side only.
const LiveTrackingMap = dynamic(
  () => import('@/components/order/LiveTrackingMap').then((m) => m.LiveTrackingMap),
  { ssr: false }
);

const ACTIVE_TRACKING_STATUSES = ['ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'ON_THE_WAY'];
const CANCELLABLE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING'];
// Close enough to the delivery address to call it "arrived" — GPS pings
// rarely land exactly on the door.
const ARRIVED_THRESHOLD_METERS = 60;

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState<[number, number] | null>(null); // [lng, lat]
  const [ridePath, setRidePath] = useState<[number, number][]>([]); // [lat, lng][] — traveled trail
  const [isConnected, setIsConnected] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const openChat = useChatUiStore((s) => s.open);

  useEffect(() => {
    ordersApi
      .getById(id)
      .then(setOrder)
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load this order')))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    setLiveLocation(null);
    setRidePath([]);
    socket.emit('order:track', { orderId: id });
    setIsConnected(socket.connected);

    const onStatus = (payload: { orderId: string; status: string }) => {
      if (payload.orderId !== id) return;
      setOrder((prev) => (prev ? { ...prev, orderStatus: payload.status as Order['orderStatus'] } : prev));
    };
    const onLocation = (payload: { orderId: string; latitude: number; longitude: number }) => {
      if (payload.orderId !== id) return;
      setLiveLocation([payload.longitude, payload.latitude]);
      setRidePath((prev) => [...prev, [payload.latitude, payload.longitude]]);
    };
    // Free, no-SMS-gateway OTP: pushed the instant the store verifies pickup.
    const onOtp = (payload: { orderId: string; otp: string }) => {
      if (payload.orderId !== id) return;
      setOrder((prev) => (prev ? { ...prev, deliveryOtp: payload.otp } : prev));
      toast.success('Your delivery OTP is ready — share it with your rider at the door.');
    };
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('order:status', onStatus);
    socket.on('delivery:location', onLocation);
    socket.on('delivery:otp', onOtp);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.emit('order:untrack', { orderId: id });
      socket.off('order:status', onStatus);
      socket.off('delivery:location', onLocation);
      socket.off('delivery:otp', onOtp);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [id]);

  async function handleCancel() {
    if (!cancelReason.trim()) return toast.error('Tell us why you are cancelling');
    try {
      const updated = await ordersApi.cancel(id, cancelReason);
      setOrder(updated);
      setShowCancel(false);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not cancel order'));
    }
  }

  async function handleSubmitReview() {
    try {
      await reviewsApi.create({ orderId: id, type: 'STORE', rating: review.rating, comment: review.comment });
      setReviewSubmitted(true);
      toast.success('Thanks for the feedback!');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not submit review'));
    }
  }

  async function openOrderChat() {
    try {
      const conversation = await chatApi.getOrderConversation(id);
      openChat(conversation._id);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isLoading || !order) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-mango border-t-transparent" />
      </div>
    );
  }

  const store = typeof order.storeId === 'object' ? (order.storeId as Store) : null;
  const isTracking = ACTIVE_TRACKING_STATUSES.includes(order.orderStatus);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-faint">{order.orderNumber}</p>
          <h1 className="mt-1 font-display text-2xl text-paper">
            {store?.name || 'Your order'}
          </h1>
          <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openOrderChat}
            className="rounded-full border border-border p-2.5 text-muted hover:border-mango hover:text-mango"
            aria-label="Chat about this order"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          {store && (
            <Badge variant="mango">
              <StoreIcon className="h-3 w-3" /> {store.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Delivery OTP — the customer's proof that the rider at the door is
          actually delivering THEIR order. Free: shown here + pushed live via
          Socket.IO, no SMS gateway involved. */}
      {order.deliveryOtp && ['PICKED_UP', 'ON_THE_WAY'].includes(order.orderStatus) && (
        <Card className="mt-6 border-mango/40 bg-mango-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KeyRound className="h-6 w-6 shrink-0 text-mango" />
              <div>
                <p className="text-sm text-mango">Give this code to your rider when they arrive</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-mango">{order.deliveryOtp}</p>
              </div>
            </div>
            <CopyButton value={order.deliveryOtp} />
          </div>
        </Card>
      )}

      {/* Live tracking */}
      {isTracking && (
        <Card className="mt-4 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Radio className={`h-4 w-4 ${isConnected ? 'text-delivered' : 'text-faint'}`} />
            <span className="text-sm font-medium text-paper">
              {isConnected ? 'Live tracking connected' : 'Connecting to live tracking...'}
            </span>
          </div>

          <LiveTrackingMap
            riderPosition={liveLocation ? [liveLocation[1], liveLocation[0]] : null}
            destination={[order.deliveryLocation.coordinates[1], order.deliveryLocation.coordinates[0]]}
            path={ridePath}
            arrived={
              !!liveLocation &&
              haversineDistanceMeters(
                [liveLocation[1], liveLocation[0]],
                [order.deliveryLocation.coordinates[1], order.deliveryLocation.coordinates[0]]
              ) <= ARRIVED_THRESHOLD_METERS
            }
          />
          {!liveLocation && (
            <p className="mt-2 text-xs text-faint">
              Showing your delivery address — your rider's live position will appear here once they're on
              the way.
            </p>
          )}
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="mb-4 font-medium text-paper">Order status</h2>
        <OrderStatusStepper status={order.orderStatus} />
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-3 font-medium text-paper">Items</h2>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start justify-between text-sm">
              <div>
                <span className="text-paper">
                  {item.quantity}× {item.name}
                </span>
                {item.variant?.name && <span className="ml-1 text-xs text-faint">({item.variant.name})</span>}
              </div>
              <span className="font-mono text-muted">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery fee</span>
            <span className="font-mono">{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Platform fee</span>
            <span className="font-mono">{formatCurrency(order.platformFee)}</span>
          </div>
          {order.pointDiscount > 0 && (
            <div className="flex justify-between text-delivered">
              <span>Points discount ({order.pointsUsed} pts)</span>
              <span className="font-mono">-{formatCurrency(order.pointDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold text-paper">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-2 font-medium text-paper">Delivery address</h2>
        <p className="text-sm text-muted">{order.deliveryAddress}</p>
      </Card>

      {CANCELLABLE_STATUSES.includes(order.orderStatus) && (
        <div className="mt-4">
          {!showCancel ? (
            <Button variant="danger" size="sm" onClick={() => setShowCancel(true)}>
              Cancel order
            </Button>
          ) : (
            <Card className="space-y-3 p-4">
              <Textarea
                label="Reason for cancelling"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleCancel}>
                  Confirm cancellation
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
                  Never mind
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {order.orderStatus === 'DELIVERED' && !reviewSubmitted && (
        <Card className="mt-4 space-y-3 p-5">
          <h2 className="font-medium text-paper">Rate this order</h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setReview((r) => ({ ...r, rating: n }))}>
                <Star
                  className={`h-6 w-6 ${n <= review.rating ? 'fill-mango text-mango' : 'text-border'}`}
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={2}
            placeholder="How was your order?"
            value={review.comment}
            onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
          />
          <Button size="sm" onClick={handleSubmitReview}>
            Submit review
          </Button>
        </Card>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <AuthGate allowedRoles={['CUSTOMER', 'SHOP_OWNER', 'SUPER_ADMIN']}>
      <OrderDetailContent />
    </AuthGate>
  );
}
