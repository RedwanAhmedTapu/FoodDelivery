'use client';

import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { pointsApi } from '@/lib/endpoints/misc';
import { PointTransaction } from '@/types';
import { AuthGate } from '@/lib/useRequireAuth';
import { Card, EmptyState, Spinner } from '@/components/ui/Primitives';
import { formatDate } from '@/lib/utils';

function PointsContent() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([pointsApi.myBalance(), pointsApi.myHistory({ limit: 30 })])
      .then(([bal, hist]) => {
        setBalance(bal);
        setHistory(hist.items);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-paper">Your points</h1>

      <Card className="mt-6 flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mango-soft">
          <Coins className="h-6 w-6 text-mango" />
        </div>
        <div>
          <p className="text-xs text-muted">Available balance</p>
          <p className="font-display text-3xl text-paper">{balance}</p>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 font-medium text-paper">History</h2>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : history.length === 0 ? (
        <EmptyState title="No point activity yet" description="Order food to start earning points." />
      ) : (
        <div className="space-y-2">
          {history.map((txn) => (
            <Card key={txn._id} className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm text-paper">{txn.description || txn.type}</p>
                <p className="text-xs text-faint">{formatDate(txn.createdAt)}</p>
              </div>
              <span className={`font-mono text-sm font-semibold ${txn.points >= 0 ? 'text-delivered' : 'text-chili'}`}>
                {txn.points >= 0 ? '+' : ''}
                {txn.points}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PointsPage() {
  return (
    <AuthGate allowedRoles={['CUSTOMER']}>
      <PointsContent />
    </AuthGate>
  );
}
