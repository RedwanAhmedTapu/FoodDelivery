'use client';

import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { ordersApi } from '@/lib/endpoints/orders';
import { Order } from '@/types';
import { AuthGate } from '@/lib/useRequireAuth';
import { OrderCard } from '@/components/order/OrderCard';
import { EmptyState, Spinner } from '@/components/ui/Primitives';

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .mine({ limit: 30 })
      .then(({ items }) => setOrders(items))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-paper">Your orders</h1>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={Receipt} title="No orders yet" description="Once you order, it'll show up here." />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGate allowedRoles={['CUSTOMER']}>
      <OrdersContent />
    </AuthGate>
  );
}
