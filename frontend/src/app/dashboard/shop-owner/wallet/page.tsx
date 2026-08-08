'use client';

import { WalletPanel } from '@/components/wallet/WalletPanel';

export default function ShopOwnerWalletPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-paper">Wallet</h1>
        <p className="mt-1 text-sm text-muted">
          Every delivered order — online-paid or cash-on-delivery — credits your share here automatically.
        </p>
      </div>
      <WalletPanel />
    </div>
  );
}
