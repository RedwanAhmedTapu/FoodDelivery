'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote } from 'lucide-react';
import { walletApi } from '@/lib/endpoints/wallet';
import { CodRemittance, RemittanceMethod } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const statusVariant: Record<string, 'neutral' | 'mango' | 'chili' | 'delivered'> = {
  PENDING: 'mango',
  CONFIRMED: 'delivered',
  REJECTED: 'chili',
};

export function CodRemittancePanel({ onConfirmed }: { onConfirmed?: () => void }) {
  const [remittances, setRemittances] = useState<CodRemittance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<RemittanceMethod>('CASH_HANDOVER');
  const [reference, setReference] = useState('');

  function load() {
    setIsLoading(true);
    walletApi
      .getMyRemittances({ limit: 10 })
      .then(({ items }) => setRemittances(items))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setIsSubmitting(true);
    try {
      await walletApi.submitCodRemittance({ amount: parsedAmount, method, reference: reference || undefined });
      toast.success('Remittance submitted — pending admin confirmation');
      setAmount('');
      setReference('');
      load();
      onConfirmed?.();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Banknote className="h-5 w-5 text-mango" />
        <h3 className="font-display text-lg text-paper">Remit COD cash</h3>
      </div>
      <p className="mt-1 text-sm text-muted">
        Every cash-on-delivery order you complete adds to your balance owed to the store/platform. Submit here once
        you've handed over or deposited that cash — an admin will confirm it to clear your balance.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-3">
        <Input
          label="Amount"
          type="number"
          min={1}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as RemittanceMethod)}>
          <option value="CASH_HANDOVER">Cash handover (office/store)</option>
          <option value="BANK">Bank deposit</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
        </Select>
        <Input
          label="Reference (optional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Txn ID / deposit slip no."
        />
        <div className="sm:col-span-3">
          <Button type="submit" isLoading={isSubmitting}>
            Submit remittance
          </Button>
        </div>
      </form>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : remittances.length === 0 ? (
          <EmptyState title="No remittances yet" />
        ) : (
          <div className="space-y-2">
            {remittances.map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="font-medium text-paper">{formatCurrency(r.amount)}</p>
                  <p className="text-xs text-muted">
                    {r.method.replace('_', ' ')} &middot; {formatDate(r.createdAt)}
                    {r.reference ? ` \u00b7 ref: ${r.reference}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                  {r.note && <p className="mt-1 max-w-[200px] text-xs text-faint">{r.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
