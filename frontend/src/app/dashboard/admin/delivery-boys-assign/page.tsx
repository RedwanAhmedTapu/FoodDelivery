'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PackageCheck, Zap, User } from 'lucide-react';
import { ordersApi } from '@/lib/endpoints/orders';
import { deliveryApi } from '@/lib/endpoints/misc';
import { Order, DeliveryBoyProfile, OrderStatus } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function AdminOrderAssignmentPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<DeliveryBoyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    Promise.all([
      ordersApi.allOrders({ orderStatus: 'READY_FOR_PICKUP', limit: 50 }),
      deliveryApi.listAll({ status: 'APPROVED', isOnline: 'true', limit: 100 }),
    ])
      .then(([orderRes, riderRes]) => {
        setOrders(orderRes.items);
        setRiders(riderRes.items.filter((r) => r.isAvailable !== false));
      })
      .catch(() => toast.error('Could not load orders or riders'))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  // Live updates: an order can leave READY_FOR_PICKUP (auto-dispatch cascade
  // finding a rider, the store cancelling, etc.) or a fresh order can arrive
  // at READY_FOR_PICKUP from another tab/admin — without this, the list only
  // ever changed on a manual "Refresh" click, and assigning an order that
  // had already been claimed elsewhere would fail with a confusing error.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onStatus = (payload: { orderId: string; status: OrderStatus }) => {
      if (payload.status === 'READY_FOR_PICKUP') {
        load();
        return;
      }
      setOrders((prev) => prev.filter((o) => o._id !== payload.orderId));
    };

    socket.on('order:status', onStatus);
    return () => {
      socket.off('order:status', onStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function assignManual(order: Order) {
    const riderId = selectedRider[order._id];
    if (!riderId) return toast.error('Pick a rider first');

    setAssigningId(order._id);
    try {
      await deliveryApi.assign(order._id, riderId);
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      toast.success(`Assigned to ${riders.find((r) => r._id === riderId)?.name || 'rider'}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not assign rider'));
    } finally {
      setAssigningId(null);
    }
  }

  async function assignAuto(order: Order) {
    setAssigningId(order._id);
    try {
      const updated = await deliveryApi.assignAuto(order._id);
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      toast.success(`Auto-assigned order ${updated.orderNumber || order.orderNumber}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No nearby rider available'));
    } finally {
      setAssigningId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-paper">Assign deliveries</h1>
          <p className="text-xs text-muted">
            {orders.length} order{orders.length === 1 ? '' : 's'} ready for pickup &middot; {riders.length} rider
            {riders.length === 1 ? '' : 's'} online
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="Nothing to assign"
          description="Orders show up here once a store marks them ready for pickup."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const store = typeof order.storeId === 'object' ? order.storeId : null;
            const isAssigning = assigningId === order._id;

            return (
              <Card key={order._id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-faint">{order.orderNumber}</p>
                      <Badge variant="mango">READY_FOR_PICKUP</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-paper">{store?.name || 'Store'}</p>
                    <p className="text-xs text-muted">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-paper">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-faint">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Select
                    className="min-w-[180px] flex-1"
                    value={selectedRider[order._id] || ''}
                    onChange={(e) =>
                      setSelectedRider((prev) => ({ ...prev, [order._id]: e.target.value }))
                    }
                  >
                    <option value="">Select a rider...</option>
                    {riders.map((rider) => (
                      <option key={rider._id} value={rider._id}>
                        {rider.name} &middot; {rider.totalDeliveries} deliveries
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isAssigning}
                    disabled={!selectedRider[order._id]}
                    onClick={() => assignManual(order)}
                  >
                    <User className="h-3.5 w-3.5" /> Assign
                  </Button>
                  <Button size="sm" isLoading={isAssigning} onClick={() => assignAuto(order)}>
                    <Zap className="h-3.5 w-3.5" /> Auto-assign
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}