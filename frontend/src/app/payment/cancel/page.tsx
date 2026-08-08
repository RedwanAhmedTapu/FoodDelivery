'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleSlash } from 'lucide-react';
import { AuthGate } from '@/lib/useRequireAuth';
import { Button } from '@/components/ui/Button';

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6">
      <CircleSlash className="mx-auto h-12 w-12 text-faint" />
      <h1 className="mt-4 font-display text-2xl text-paper">Payment cancelled</h1>
      <p className="mt-2 text-sm text-muted">
        You cancelled the payment before it completed. Nothing was charged.
      </p>
      {tranId && <p className="mt-3 font-mono text-xs text-faint">Ref: {tranId}</p>}

      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" onClick={() => router.push('/checkout')}>
          Return to checkout
        </Button>
        <Button variant="outline" onClick={() => router.push('/')}>
          Back to home
        </Button>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <AuthGate>
      <Suspense fallback={null}>
        <PaymentCancelContent />
      </Suspense>
    </AuthGate>
  );
}
