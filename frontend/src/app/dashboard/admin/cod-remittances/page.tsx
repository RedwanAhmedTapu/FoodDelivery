'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { walletApi } from '@/lib/endpoints/wallet';
import { CodRemittance } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const statusVariant: Record<string, 'neutral' | 'mango' | 'chili' | 'delivered'> = {
  PENDING: 'mango',
  CONFIRMED: 'delivered',
  REJECTED: 'chili',
};

function riderName(r: CodRemittance) {
  if (typeof r.deliveryBoyUserId === 'string') return r.deliveryBoyUserId;
  return r.deliveryBoyUserId.name;
}
function riderContact(r: CodRemittance) {
  if (typeof r.deliveryBoyUserId === 'string') return null;
  return r.deliveryBoyUserId.phone || r.deliveryBoyUserId.email;
}

export default function AdminCodRemittancesPage() {
  const [remittances, setRemittances] = useState<CodRemittance[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    walletApi
      .adminListRemittances({ status: statusFilter || undefined, limit: 100 })
      .then(({ items }) => setRemittances(items))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, [statusFilter]);

  async function confirm(r: CodRemittance) {
    setProcessingId(r._id);
    try {
      await walletApi.adminConfirmRemittance(r._id);
      toast.success('Remittance confirmed — rider balance updated');
      setRemittances((prev) => prev.filter((x) => x._id !== r._id));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function reject(r: CodRemittance) {
    const note = window.prompt('Reason for rejecting this remittance (optional):') || undefined;
    setProcessingId(r._id);
    try {
      await walletApi.adminRejectRemittance(r._id, note);
      toast.success('Remittance rejected');
      setRemittances((prev) => prev.filter((x) => x._id !== r._id));
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
          <h1 className="font-display text-2xl text-paper">COD cash remittances</h1>
          <p className="mt-1 text-sm text-muted">
            Confirm once a rider's cash-on-delivery collection has actually been handed over or deposited — this
            clears the corresponding debt from their wallet.
          </p>
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : remittances.length === 0 ? (
        <EmptyState title="No remittances" description="Requests matching this filter will show up here." />
      ) : (
        <div className="space-y-3">
          {remittances.map((r) => (
            <Card key={r._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-paper">{riderName(r)}</p>
                  <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {riderContact(r)} &middot; {formatDate(r.createdAt)}
                </p>
                <p className="mt-1 text-sm text-paper">
                  <span className="font-mono font-semibold">{formatCurrency(r.amount)}</span> via{' '}
                  {r.method.replace('_', ' ')}
                  {r.reference ? ` — ref: ${r.reference}` : ''}
                </p>
                {r.note && <p className="mt-1 text-xs text-faint">Note: {r.note}</p>}
              </div>
              {r.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button size="sm" isLoading={processingId === r._id} onClick={() => confirm(r)}>
                    Confirm received
                  </Button>
                  <Button size="sm" variant="danger" isLoading={processingId === r._id} onClick={() => reject(r)}>
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
