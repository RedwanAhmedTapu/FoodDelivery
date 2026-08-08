'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { walletApi } from '@/lib/endpoints/wallet';
import { PayoutRequest } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const statusVariant: Record<string, 'neutral' | 'mango' | 'chili' | 'delivered'> = {
  PENDING: 'mango',
  PAID: 'delivered',
  REJECTED: 'chili',
};

function ownerName(payout: PayoutRequest) {
  if (typeof payout.ownerId === 'string') return payout.ownerId;
  return payout.ownerId.name;
}
function ownerContact(payout: PayoutRequest) {
  if (typeof payout.ownerId === 'string') return null;
  return payout.ownerId.phone || payout.ownerId.email;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    walletApi
      .adminListPayouts({ status: statusFilter || undefined, limit: 100 })
      .then(({ items }) => setPayouts(items))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, [statusFilter]);

  async function process(payout: PayoutRequest, action: 'PAID' | 'REJECTED') {
    const adminNote =
      action === 'REJECTED' ? window.prompt('Reason for rejecting this payout (optional):') || undefined : undefined;
    setProcessingId(payout._id);
    try {
      await walletApi.adminProcessPayout(payout._id, action, adminNote);
      toast.success(action === 'PAID' ? 'Marked as paid' : 'Payout rejected');
      setPayouts((prev) => prev.filter((p) => p._id !== payout._id));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-paper">Payout requests</h1>
          <p className="mt-1 text-sm text-muted">Store owner and rider withdrawal requests, oldest first.</p>
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState title="No payout requests" description="Requests matching this filter will show up here." />
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => (
            <Card key={p._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-paper">{ownerName(p)}</p>
                  <Badge variant="neutral">{p.ownerType === 'SHOP_OWNER' ? 'Store owner' : 'Rider'}</Badge>
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {ownerContact(p)} &middot; {formatDate(p.createdAt)}
                </p>
                <p className="mt-1 text-sm text-paper">
                  <span className="font-mono font-semibold">{formatCurrency(p.amount)}</span> via {p.method}
                  {' — '}
                  {p.accountDetails.accountName} ({p.accountDetails.accountNumber}
                  {p.accountDetails.bankName ? `, ${p.accountDetails.bankName}` : ''})
                </p>
                {p.adminNote && <p className="mt-1 text-xs text-faint">Note: {p.adminNote}</p>}
              </div>
              {p.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button size="sm" isLoading={processingId === p._id} onClick={() => process(p, 'PAID')}>
                    Mark as paid
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={processingId === p._id}
                    onClick={() => process(p, 'REJECTED')}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
