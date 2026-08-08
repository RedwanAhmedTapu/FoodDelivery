'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownCircle, ArrowUpCircle, Wallet as WalletIcon } from 'lucide-react';
import { walletApi } from '@/lib/endpoints/wallet';
import { PayoutMethod, PayoutRequest, Wallet, WalletTransaction } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const payoutStatusVariant: Record<string, 'neutral' | 'mango' | 'chili' | 'delivered'> = {
  PENDING: 'mango',
  PAID: 'delivered',
  REJECTED: 'chili',
};

const referenceLabel: Record<string, string> = {
  ORDER: 'Order settlement',
  PAYOUT: 'Payout',
  COD_REMITTANCE: 'COD remittance',
  ADJUSTMENT: 'Admin adjustment',
};

/**
 * Full wallet UI for a single owner (shop owner or delivery boy): balance,
 * a "request payout" form, transaction ledger, and a history of past payout
 * requests. Both dashboards render this unchanged — the backend already
 * scopes everything to req.user's role, so no ownerType prop is needed here.
 */
export function WalletPanel({ extra }: { extra?: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('BKASH');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  function load() {
    setIsLoading(true);
    Promise.all([walletApi.getMine(), walletApi.getMyTransactions({ limit: 20 }), walletApi.getMyPayouts({ limit: 10 })])
      .then(([w, txns, po]) => {
        setWallet(w);
        setTransactions(txns.items);
        setPayouts(po.items);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function submitPayout(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!accountName.trim() || !accountNumber.trim()) {
      toast.error('Account name and number are required');
      return;
    }
    setIsRequesting(true);
    try {
      await walletApi.requestPayout({
        amount: parsedAmount,
        method,
        accountDetails: { accountName, accountNumber, bankName: bankName || undefined },
      });
      toast.success('Payout requested — an admin will review it shortly');
      setAmount('');
      setAccountName('');
      setAccountNumber('');
      setBankName('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsRequesting(false);
    }
  }

  if (isLoading && !wallet) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mango-soft">
            <WalletIcon className="h-6 w-6 text-mango" />
          </div>
          <div>
            <p className="text-sm text-muted">Available balance</p>
            <p className={`font-display text-3xl font-bold ${balance < 0 ? 'text-chili' : 'text-paper'}`}>
              {formatCurrency(balance)}
            </p>
            {balance < 0 && (
              <p className="mt-1 text-xs text-chili">
                Negative balance — you're holding cash-on-delivery collections that belong to the store/platform.
              </p>
            )}
          </div>
        </div>
        {extra}
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg text-paper">Request a payout</h3>
        <p className="mt-1 text-sm text-muted">
          Funds are reserved immediately when you submit a request. An admin reviews and sends it to your account.
        </p>
        <form onSubmit={submitPayout} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            type="number"
            min={1}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Up to ${formatCurrency(Math.max(balance, 0))}`}
          />
          <Select label="Payout method" value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)}>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="BANK">Bank transfer</option>
          </Select>
          <Input
            label="Account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Name on the account"
          />
          <Input
            label={method === 'BANK' ? 'Account number' : `${method === 'BKASH' ? 'bKash' : 'Nagad'} number`}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={method === 'BANK' ? 'Account number' : '01XXXXXXXXX'}
          />
          {method === 'BANK' && (
            <Input
              label="Bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="sm:col-span-2"
            />
          )}
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isRequesting} disabled={balance <= 0}>
              Request payout
            </Button>
            {balance <= 0 && <span className="ml-3 text-xs text-faint">No available balance to withdraw</span>}
          </div>
        </form>
      </Card>

      {payouts.length > 0 && (
        <Card className="p-6">
          <h3 className="font-display text-lg text-paper">Payout history</h3>
          <div className="mt-4 space-y-2">
            {payouts.map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="font-medium text-paper">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted">
                    {p.method} &middot; {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={payoutStatusVariant[p.status]}>{p.status}</Badge>
                  {p.adminNote && <p className="mt-1 max-w-[200px] text-xs text-faint">{p.adminNote}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-display text-lg text-paper">Transaction history</h3>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Earnings from delivered orders will show up here." />
        ) : (
          <div className="mt-4 space-y-2">
            {transactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  {t.type === 'CREDIT' ? (
                    <ArrowDownCircle className="h-5 w-5 shrink-0 text-delivered" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5 shrink-0 text-chili" />
                  )}
                  <div>
                    <p className="text-sm text-paper">{t.description || referenceLabel[t.referenceType]}</p>
                    <p className="text-xs text-faint">{formatDate(t.createdAt)}</p>
                  </div>
                </div>
                <p className={`font-mono font-semibold ${t.type === 'CREDIT' ? 'text-delivered' : 'text-chili'}`}>
                  {t.type === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
