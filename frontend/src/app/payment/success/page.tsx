'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { ordersApi } from '@/lib/endpoints/orders';
import { Order } from '@/types';
import { AuthGate } from '@/lib/useRequireAuth';
import { Card } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

// tran_id is built on the backend as `SSL-${orderId}-${Date.now()}`.
// Mongo ObjectIds are 24 hex chars with no dashes, so splitting on '-'
// safely yields ['SSL', orderId, timestamp].
function extractOrderId(tranId: string | null): string | null {
  if (!tranId) return null;
  const parts = tranId.split('-');
  if (parts.length < 3 || parts[0] !== 'SSL') return null;
  return parts[1];
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');
  const orderId = extractOrderId(tranId);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Missing order reference');
      setIsLoading(false);
      return;
    }
    ordersApi
      .getById(orderId)
      .then(setOrder)
      .catch(() => setError('Could not load your order details'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-mango border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6">
        <AlertTriangle className="mx-auto h-10 w-10 text-faint" />
        <h1 className="mt-4 font-display text-xl text-paper">Payment received</h1>
        <p className="mt-2 text-sm text-muted">
          {error || 'Your payment went through, but we could not load the order details.'}
        </p>
        <Button className="mt-6 w-full" onClick={() => router.push('/orders')}>
          Go to your orders
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6">
      <CheckCircle2 className="mx-auto h-12 w-12 text-delivered" />
      <h1 className="mt-4 font-display text-2xl text-paper">Payment successful</h1>
      <p className="mt-2 text-sm text-muted">
        Your order <span className="font-mono text-paper">{order.orderNumber}</span> has been confirmed.
      </p>

      <Card className="mt-6 space-y-2 p-5 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Amount paid</span>
          <span className="font-mono text-paper">{formatCurrency(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Order status</span>
          <span className="text-paper">{order.orderStatus}</span>
        </div>
        {tranId && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Transaction ID</span>
            <span className="font-mono text-xs text-faint">{tranId}</span>
          </div>
        )}
      </Card>

      <Button className="mt-6 w-full" size="lg" onClick={() => router.push(`/orders/${order._id}`)}>
        View order details
      </Button>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <AuthGate allowedRoles={['CUSTOMER']}>
      <PaymentSuccessContent />
    </AuthGate>
  );
}