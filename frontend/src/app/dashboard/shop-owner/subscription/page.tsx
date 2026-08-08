'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { storesApi } from '@/lib/endpoints/stores';
import { subscriptionsApi } from '@/lib/endpoints/subscriptions';
import { BillingCycle, Store, StoreOwnerStatus, SubscriptionPlan } from '@/types';
import { Card, Badge, Spinner, EmptyState } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import Link from 'next/link';

const CYCLE_LABEL: Record<BillingCycle, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly (3 months)',
  HALF_YEARLY: 'Half-yearly (6 months)',
  YEARLY: 'Yearly (12 months)',
};

const CYCLE_SAVE_HINT: Record<BillingCycle, string | null> = {
  MONTHLY: null,
  QUARTERLY: 'Pay less per month than monthly',
  HALF_YEARLY: 'Better value than quarterly',
  YEARLY: 'Best value — biggest saving',
};

export default function ShopOwnerSubscriptionPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [status, setStatus] = useState<StoreOwnerStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingCycle, setPayingCycle] = useState<BillingCycle | null>(null);

  useEffect(() => {
    storesApi.myStores().then((s) => {
      setStores(s);
      if (s.length) setSelectedStoreId(s[0]._id);
      else setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    setIsLoading(true);
    Promise.all([
      subscriptionsApi.getStatus(selectedStoreId),
      subscriptionsApi.getEffectivePlans(selectedStoreId),
    ])
      .then(([s, p]) => {
        setStatus(s);
        setPlans(p);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [selectedStoreId]);

  async function handlePay(cycle: BillingCycle) {
    setPayingCycle(cycle);
    try {
      const { gatewayPageURL } = await subscriptionsApi.subscribe(selectedStoreId, cycle);
      if (gatewayPageURL) {
        window.location.href = gatewayPageURL;
      } else {
        toast.error('Payment gateway did not return a checkout link. Please try again.');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start payment'));
    } finally {
      setPayingCycle(null);
    }
  }

  if (stores.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="Create a store first"
        description="You need a store before you can subscribe to a plan."
        action={
          <Link href="/dashboard/shop-owner/stores/new">
            <Button>Create store</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {stores.length > 1 && (
        <Select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="max-w-xs">
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
      )}

      {isLoading || !status ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <Card className={`p-5 ${status.isLive ? 'border-delivered/30' : 'border-chili/30'}`}>
            <div className="flex items-start gap-3">
              {status.isLive ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-delivered" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-chili" />
              )}
              <div>
                <p className="font-medium text-paper">
                  {status.isLive ? 'Your store is live' : 'Your store is currently OFF'}
                </p>
                {status.reasons.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {status.reasons.map((r) => (
                      <li key={r.code} className="text-sm text-muted">
                        &bull; {r.message}
                      </li>
                    ))}
                  </ul>
                )}
                {status.subscriptionExpiresAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-faint">
                    <Clock className="h-3.5 w-3.5" />
                    {status.subscriptionStatus === 'ACTIVE' ? 'Renews / expires' : 'Expired'} on{' '}
                    {formatDate(status.subscriptionExpiresAt)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div>
            <h2 className="mb-3 font-medium text-paper">Choose a plan</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.billingCycle} className="flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-paper">{CYCLE_LABEL[plan.billingCycle]}</p>
                      {plan.isOverride && <Badge variant="mango">Custom price</Badge>}
                    </div>
                    {plan.price !== null ? (
                      <p className="mt-2 font-mono text-2xl text-paper">{formatCurrency(plan.price)}</p>
                    ) : (
                      <p className="mt-2 text-sm text-faint">Not configured yet</p>
                    )}
                    {CYCLE_SAVE_HINT[plan.billingCycle] && (
                      <p className="mt-1 text-xs text-mango">{CYCLE_SAVE_HINT[plan.billingCycle]}</p>
                    )}
                  </div>
                  <Button
                    className="mt-4 w-full"
                    disabled={plan.price === null}
                    isLoading={payingCycle === plan.billingCycle}
                    onClick={() => handlePay(plan.billingCycle)}
                  >
                    <CreditCard className="h-4 w-4" />
                    {status.subscriptionStatus === 'ACTIVE' ? 'Renew' : 'Subscribe'} & pay
                  </Button>
                </Card>
              ))}
            </div>
            <p className="mt-3 text-xs text-faint">
              Payments are processed securely via SSLCommerz. Your store activates automatically the
              moment payment is confirmed.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
