'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Power, Navigation, KeyRound, MessageCircle, MapPin, UserCircle } from 'lucide-react';
import { deliveryApi } from '@/lib/endpoints/misc';
import { ordersApi } from '@/lib/endpoints/orders';
import { chatApi } from '@/lib/endpoints/chat';
import { DeliveryBoyProfile, Order, Store } from '@/types';
import { getSocket } from '@/lib/socket';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatCurrency, ORDER_STATUS_LABEL, getCurrentPosition, haversineDistanceMeters } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { useChatUiStore } from '@/store/useChatUiStore';
import { useDeliveryOrdersStore } from '@/store/useDeliveryOrdersStore';

// Leaflet touches `window` on import, so it must never be part of the
// server-rendered bundle — load it client-side only.
const LiveTrackingMap = dynamic(
  () => import('@/components/order/LiveTrackingMap').then((m) => m.LiveTrackingMap),
  { ssr: false }
);

const ARRIVED_THRESHOLD_METERS = 60;

export default function DeliveryOverviewPage() {
  const [profile, setProfile] = useState<DeliveryBoyProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otpDrafts, setOtpDrafts] = useState<Record<string, string>>({});
  const [submittingOtpFor, setSubmittingOtpFor] = useState<string | null>(null);
  // Own GPS trail while an order is ON_THE_WAY — [lat, lng][], oldest first —
  // so the rider can see the route they've actually driven so far, not just
  // a single dot. Keyed by orderId so switching deliveries starts a fresh trail.
  const [ownPath, setOwnPath] = useState<{ orderId: string; points: [number, number][] } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const openChat = useChatUiStore((s) => s.open);
  const refreshKey = useDeliveryOrdersStore((s) => s.refreshKey);

  function loadOrders() {
    deliveryApi.myOrders({ active: 'true' }).then(({ items }) => setOrders(items));
  }

  useEffect(() => {
    Promise.all([deliveryApi.myProfile(), deliveryApi.myOrders({ active: 'true' })])
      .then(([p, o]) => {
        setProfile(p);
        setOrders(o.items);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch whenever DispatchOfferModal signals a newly-accepted delivery —
  // that order doesn't otherwise exist in this component's state yet.
  useEffect(() => {
    if (refreshKey > 0) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // A brand-new assignment (auto-dispatch OR an admin/store manually
  // assigning this rider) is pushed to the rider's personal room as
  // `delivery:assigned`. Without listening for it here, an order — and its
  // pickup PIN — simply doesn't exist in this page's state until the rider
  // manually reloads: the order isn't in `orders` yet, so this page never
  // joins its `order:{id}` room to hear the accompanying `order:status`
  // event either. Refetching the list on this event is what makes a newly
  // assigned delivery (and its PIN) show up live.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onAssigned = () => loadOrders();
    socket.on('delivery:assigned', onAssigned);
    return () => {
      socket.off('delivery:assigned', onAssigned);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live status updates: join each active order's tracking room (the same
  // room the customer's page uses) so a status change made elsewhere — the
  // store verifying the pickup PIN, for instance — shows up here instantly
  // instead of requiring a manual page refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || orders.length === 0) return;

    orders.forEach((o) => socket.emit('order:track', { orderId: o._id }));

    const onStatus = (payload: { orderId: string; status: string }) => {
      setOrders((prev) => {
        const stillActive = ['ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'ON_THE_WAY'].includes(payload.status);
        if (!stillActive) return prev.filter((o) => o._id !== payload.orderId);
        return prev.map((o) => (o._id === payload.orderId ? { ...o, orderStatus: payload.status as Order['orderStatus'] } : o));
      });
    };
    socket.on('order:status', onStatus);

    return () => {
      orders.forEach((o) => socket.emit('order:untrack', { orderId: o._id }));
      socket.off('order:status', onStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.map((o) => o._id).join(',')]);

  // Push GPS location while online: updates backend record + live-broadcasts to any active order
  useEffect(() => {
    if (!profile?.isOnline || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const onTheWayOrder = orders.find((o) => o.orderStatus === 'ON_THE_WAY');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        deliveryApi.pushLocation(coords).catch(() => {});

        if (onTheWayOrder) {
          const socket = getSocket();
          socket?.emit('delivery:location:update', {
            orderId: onTheWayOrder._id,
            latitude: coords[1],
            longitude: coords[0],
          });

          // Build up this order's traveled trail locally (own GPS is the
          // rider's own most reliable source — no need to round-trip
          // through the socket for the map they're looking at themselves).
          setOwnPath((prev) => {
            const point: [number, number] = [coords[1], coords[0]];
            if (!prev || prev.orderId !== onTheWayOrder._id) {
              return { orderId: onTheWayOrder._id, points: [point] };
            }
            return { orderId: prev.orderId, points: [...prev.points, point] };
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [profile?.isOnline, orders]);

  async function toggleOnline() {
    if (!profile) return;
    try {
      if (!profile.isOnline) {
        // Get a real GPS fix and push it BEFORE announcing "online" — going
        // online without ever having a real location leaves the rider
        // sitting at the backend's default [0,0] coordinates, invisible to
        // every dispatch search, with no error shown anywhere. Failing loud
        // here (e.g. location permission blocked/denied) beats a rider who
        // looks online but silently never receives an order.
        try {
          const { coords } = await getCurrentPosition();
          await deliveryApi.pushLocation(coords);
        } catch {
          toast.error('Enable location access to go online — riders need a live GPS position to receive orders.');
          return;
        }
      }
      const updated = await deliveryApi.setOnline(!profile.isOnline);
      setProfile(updated);
      toast.success(updated.isOnline ? "You're online" : "You're offline");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function startDelivering(order: Order) {
    try {
      const updated = await ordersApi.updateStatus(order._id, 'ON_THE_WAY');
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success('On the way!');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function confirmDelivery(order: Order) {
    const otp = otpDrafts[order._id];
    if (!otp || otp.length < 3) return toast.error('Ask the customer for their delivery OTP');

    setSubmittingOtpFor(order._id);
    try {
      await ordersApi.verifyDelivery(order._id, otp);
      await deliveryApi.complete(order._id).catch(() => {});
      toast.success('Delivered! Nice work.');
      loadOrders();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Incorrect OTP'));
    } finally {
      setSubmittingOtpFor(null);
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

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between p-5">
        <div>
          <p className="font-medium text-paper">
            You're currently {profile.isOnline ? 'online' : 'offline'}
          </p>
          <p className="text-xs text-muted">
            {profile.totalDeliveries} deliveries &middot; {formatCurrency(profile.totalEarnings)} earned
          </p>
        </div>
        <Button variant={profile.isOnline ? 'danger' : 'primary'} onClick={toggleOnline}>
          <Power className="h-4 w-4" /> {profile.isOnline ? 'Go offline' : 'Go online'}
        </Button>
      </Card>

      {profile.status !== 'APPROVED' && (
        <Card className="border-mango/30 p-4 text-sm text-mango">
          <p>Your account is pending admin approval. You'll be able to go online once approved.</p>
          <Link
            href="/dashboard/delivery/profile"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2"
          >
            <UserCircle className="h-3.5 w-3.5" /> Complete your profile to help admin verify you faster
          </Link>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-medium text-paper">Active deliveries</h2>
        {orders.length === 0 ? (
          <EmptyState
            icon={Navigation}
            title="No active deliveries"
            description="Accept an incoming offer to see it here."
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const store = typeof order.storeId === 'object' ? (order.storeId as Store) : null;
              return (
                <Card key={order._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-faint">{order.orderNumber}</p>
                      <p className="font-medium text-paper">{store?.name}</p>
                      <p className="mt-1 text-xs text-muted">{order.deliveryAddress}</p>
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

                  {order.orderStatus === 'ASSIGNED_TO_DELIVERY' && order.pickupPin && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-mango/30 bg-mango-soft px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-mango" />
                        <p className="text-sm text-mango">
                          Show this PIN to the store: <span className="font-mono font-bold">{order.pickupPin}</span>
                        </p>
                      </div>
                      <CopyButton value={order.pickupPin} />
                    </div>
                  )}

                  {order.orderStatus === 'PICKED_UP' && (
                    <Button size="sm" className="mt-3" onClick={() => startDelivering(order)}>
                      Start delivering
                    </Button>
                  )}

                  {order.orderStatus === 'ON_THE_WAY' && (
                    <>
                      {(() => {
                        const trail = ownPath?.orderId === order._id ? ownPath.points : [];
                        const currentPos = trail.length > 0 ? trail[trail.length - 1] : null;
                        const destination: [number, number] = [
                          order.deliveryLocation.coordinates[1],
                          order.deliveryLocation.coordinates[0],
                        ];
                        const arrived = currentPos
                          ? haversineDistanceMeters(currentPos, destination) <= ARRIVED_THRESHOLD_METERS
                          : false;
                        return (
                          <div className="mt-3">
                            <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                              <MapPin className={`h-3.5 w-3.5 ${arrived ? 'text-delivered' : 'text-mango'}`} />
                              {arrived
                                ? "You're at the delivery location"
                                : 'Live route to the delivery address'}
                            </div>
                            <LiveTrackingMap
                              riderPosition={currentPos}
                              destination={destination}
                              path={trail}
                              arrived={arrived}
                              destinationLabel={order.deliveryAddress}
                              riderLabel="You"
                              lineColor="#ef4444"
                            />
                          </div>
                        );
                      })()}
                      <div className="mt-3 flex gap-2">
                        <Input
                          placeholder="Ask customer for OTP"
                          value={otpDrafts[order._id] || ''}
                          onChange={(e) => setOtpDrafts((prev) => ({ ...prev, [order._id]: e.target.value }))}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          isLoading={submittingOtpFor === order._id}
                          onClick={() => confirmDelivery(order)}
                        >
                          Confirm delivery
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
