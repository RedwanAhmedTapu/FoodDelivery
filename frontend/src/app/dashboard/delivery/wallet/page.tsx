'use client';

import { useState } from 'react';
import { WalletPanel } from '@/components/wallet/WalletPanel';
import { CodRemittancePanel } from '@/components/wallet/CodRemittancePanel';

export default function DeliveryWalletPage() {
  // Bumping this forces WalletPanel to remount and refetch after a
  // remittance is submitted, so the (still-pending, so balance won't move
  // yet) history feels connected without a manual page reload.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-paper">Wallet</h1>
        <p className="mt-1 text-sm text-muted">
          Delivery fees are credited automatically. Cash-on-delivery orders also debit the store/platform's share
          from your balance — remit that cash below to clear it.
        </p>
      </div>
      <div className="space-y-6">
        <WalletPanel key={refreshKey} />
        <CodRemittancePanel onConfirmed={() => setRefreshKey((k) => k + 1)} />
      </div>
    </div>
  );
}
