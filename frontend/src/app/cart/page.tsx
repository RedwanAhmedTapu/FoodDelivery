'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { AuthGate } from '@/lib/useRequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, Spinner } from '@/components/ui/Primitives';
import { formatCurrency } from '@/lib/utils';

function CartContent() {
  const { cart, subtotal, isLoading, refresh, updateItem, removeItem, clear } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && !cart) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add something delicious from a nearby store."
          action={
            <Link href="/stores">
              <Button>Browse stores</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-paper">Your cart</h1>
        <button onClick={() => clear()} className="text-sm text-faint hover:text-chili">
          Clear cart
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {cart.items.map((item) => (
          <Card key={item._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-paper">{item.name}</p>
                {item.variant?.name && <p className="text-xs text-muted">Size: {item.variant.name}</p>}
                {item.addons.length > 0 && (
                  <p className="text-xs text-muted">+ {item.addons.map((a) => a.name).join(', ')}</p>
                )}
                {item.notes && <p className="mt-1 text-xs italic text-faint">"{item.notes}"</p>}
              </div>
              <button
                onClick={() => removeItem(item._id)}
                className="shrink-0 text-faint hover:text-chili"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1">
                <button
                  onClick={() => updateItem(item._id, item.quantity - 1)}
                  className="text-lg text-muted"
                >
                  –
                </button>
                <span className="w-4 text-center font-mono text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateItem(item._id, item.quantity + 1)}
                  className="text-lg text-mango"
                >
                  +
                </button>
              </div>
              <span className="font-mono font-semibold text-paper">
                {formatCurrency(
                  (item.unitPrice + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity
                )}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="font-mono text-paper">{formatCurrency(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-faint">Delivery fee, tax & platform fee calculated at checkout.</p>
        <Button className="mt-4 w-full" size="lg" onClick={() => router.push('/checkout')}>
          Proceed to checkout
        </Button>
      </Card>
    </div>
  );
}

export default function CartPage() {
  return (
    <AuthGate allowedRoles={['CUSTOMER']}>
      <CartContent />
    </AuthGate>
  );
}
