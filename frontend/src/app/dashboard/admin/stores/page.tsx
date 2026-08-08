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
    storesApi.adminAll({ limit: 100 }).then(({ items }) => setStores(items)).finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function decide(store: Store, approvalStatus: 'APPROVED' | 'REJECTED') {
    try {
      const reason = approvalStatus === 'REJECTED' ? window.prompt('Rejection reason?') || undefined : undefined;
      const updated = await storesApi.setApproval(store._id, approvalStatus, reason);
      setStores((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
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
    <div className="space-y-3">
      {stores.map((store) => (
        <Card key={store._id} className="flex items-center justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-paper">{store.name}</p>
              <Badge variant={approvalVariant[store.approvalStatus]}>{store.approvalStatus}</Badge>
            </div>
            <p className="text-xs text-muted">{store.address}</p>
          </div>
          {store.approvalStatus === 'PENDING' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(store, 'APPROVED')}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => decide(store, 'REJECTED')}>
                Reject
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
