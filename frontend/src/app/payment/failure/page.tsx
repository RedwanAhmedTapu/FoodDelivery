'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { AuthGate } from '@/lib/useRequireAuth';
import { Button } from '@/components/ui/Button';

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6">
      <XCircle className="mx-auto h-12 w-12 text-chili" />
      <h1 className="mt-4 font-display text-2xl text-paper">Payment failed</h1>
      <p className="mt-2 text-sm text-muted">
        Your payment could not be completed. No charge was made — you can try again or use a
        different payment method.
      </p>
      {tranId && <p className="mt-3 font-mono text-xs text-faint">Ref: {tranId}</p>}

      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" onClick={() => router.push('/checkout')}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.push('/orders')}>
          Go to your orders
        </Button>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <AuthGate>
      <Suspense fallback={null}>
        <PaymentFailureContent />
      </Suspense>
    </AuthGate>
  );
}
