'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { storesApi } from '@/lib/endpoints/stores';
import { Store } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/api';

const approvalVariant: Record<string, 'neutral' | 'mango' | 'chili'> = {
  PENDING: 'neutral',
  APPROVED: 'mango',
  REJECTED: 'chili',
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    storesApi
      .adminAll({ limit: 100 })
      .then(({ items }) => setStores(items))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function decide(store: Store, approvalStatus: 'APPROVED' | 'REJECTED') {
    try {
      const reason =
        approvalStatus === 'REJECTED'
          ? window.prompt('Rejection reason?') || undefined
          : undefined;
      const updated = await storesApi.setApproval(
        store._id,
        approvalStatus,
        reason,
      );
      setStores((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s)),
      );
      toast.success(`Store ${approvalStatus.toLowerCase()}`);
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

  if (stores.length === 0) return <EmptyState title="No stores yet" />;

  return (
    <div className="space-y-4">
      {stores.map((store) => (
        <Card key={store._id} className="p-5">
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-paper">
                  {store.name}
                </h3>
                <Badge variant={approvalVariant[store.approvalStatus]}>
                  {store.approvalStatus}
                </Badge>
                <Badge
                  variant={
                    store.subscriptionStatus === 'ACTIVE' ? 'mango' : 'neutral'
                  }
                >
                  {store.subscriptionStatus}
                </Badge>
                {!store.isActive && (
                  <Badge variant="chili">INACTIVE</Badge>
                )}
              </div>

              {store.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {store.description}
                </p>
              )}
            </div>

            {store.approvalStatus === 'PENDING' && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => decide(store, 'APPROVED')}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => decide(store, 'REJECTED')}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>

          {/* ── Contact row ────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconPhone />
              {store.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconMail />
              {store.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconPin />
              {store.address}
            </span>
          </div>

          {/* ── Detail grid ────────────────────────────────── */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Detail label="Opens" value={formatTime(store.openingTime)} />
            <Detail label="Closes" value={formatTime(store.closingTime)} />
            <Detail label="Min. Order" value={`৳${store.minimumOrder}`} />
            <Detail
              label="Est. Delivery"
              value={`${store.estimatedDeliveryTime} min`}
            />
            <Detail label="Delivery Radius" value={`${store.deliveryRadius} km`} />
            <Detail
              label="Orders"
              value={String(store.totalOrders ?? 0)}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Small helpers ─────────────────────────────────────────── */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-paper">{value}</p>
    </div>
  );
}

function formatTime(t?: string | null) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/* ─── Inline SVG icons (keep bundle tiny) ───────────────────── */

function IconPhone() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}