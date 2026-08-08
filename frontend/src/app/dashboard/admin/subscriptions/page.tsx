'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Search } from 'lucide-react';
import { storesApi } from '@/lib/endpoints/stores';
import { subscriptionsApi } from '@/lib/endpoints/subscriptions';
import { BillingCycle, Store, SubscriptionPlan } from '@/types';
import { Card, Spinner, Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { apiErrorMessage } from '@/lib/api';

const CYCLES: BillingCycle[] = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'];
const CYCLE_LABEL: Record<BillingCycle, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-yearly',
  YEARLY: 'Yearly',
};

export default function AdminSubscriptionsPage() {
  const [globalPlans, setGlobalPlans] = useState<Record<BillingCycle, string>>({
    MONTHLY: '',
    QUARTERLY: '',
    HALF_YEARLY: '',
    YEARLY: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Per-store override search
  const [storeSearch, setStoreSearch] = useState('');
  const [storeResults, setStoreResults] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [overrides, setOverrides] = useState<Record<BillingCycle, string>>({
    MONTHLY: '',
    QUARTERLY: '',
    HALF_YEARLY: '',
    YEARLY: '',
  });
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  useEffect(() => {
    subscriptionsApi
      .listGlobalPlans()
      .then((plans) => {
        const map: Record<string, string> = { MONTHLY: '', QUARTERLY: '', HALF_YEARLY: '', YEARLY: '' };
        plans.forEach((p) => {
          map[p.billingCycle] = p.price !== null ? String(p.price) : '';
        });
        setGlobalPlans(map as Record<BillingCycle, string>);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function saveGlobalPlans() {
    setIsSaving(true);
    try {
      await Promise.all(
        CYCLES.filter((c) => globalPlans[c] !== '').map((c) =>
          subscriptionsApi.upsertGlobalPlan(c, Number(globalPlans[c]))
        )
      );
      toast.success('Global pricing updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function searchStores() {
    if (!storeSearch.trim()) return;
    const { items } = await storesApi.adminAll({ search: storeSearch, limit: 10 });
    setStoreResults(items);
  }

  async function selectStore(store: Store) {
    setSelectedStore(store);
    setStoreResults([]);
    setStoreSearch(store.name);
    const overridesList = await subscriptionsApi.listStoreOverrides(store._id);
    const map: Record<string, string> = { MONTHLY: '', QUARTERLY: '', HALF_YEARLY: '', YEARLY: '' };
    overridesList.forEach((p: SubscriptionPlan) => {
      map[p.billingCycle] = String(p.price);
    });
    setOverrides(map as Record<BillingCycle, string>);
  }

  async function saveOverrides() {
    if (!selectedStore) return;
    setIsSavingOverride(true);
    try {
      await Promise.all(
        CYCLES.filter((c) => overrides[c] !== '').map((c) =>
          subscriptionsApi.upsertStoreOverride(selectedStore._id, c, Number(overrides[c]))
        )
      );
      toast.success(`Custom pricing saved for ${selectedStore.name}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSavingOverride(false);
    }
  }

  async function clearOverride(cycle: BillingCycle) {
    if (!selectedStore) return;
    try {
      await subscriptionsApi.removeStoreOverride(selectedStore._id, cycle);
      setOverrides((prev) => ({ ...prev, [cycle]: '' }));
      toast.success('Reverted to global price for this cycle');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-5">
        <h2 className="font-medium text-paper">Global default pricing</h2>
        <p className="mt-1 text-xs text-muted">
          Applies to every store that doesn't have a custom price set below.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {CYCLES.map((cycle) => (
              <Input
                key={cycle}
                label={`${CYCLE_LABEL[cycle]} (৳)`}
                type="number"
                value={globalPlans[cycle]}
                onChange={(e) => setGlobalPlans((prev) => ({ ...prev, [cycle]: e.target.value }))}
                placeholder="e.g. 500"
              />
            ))}
          </div>
        )}
        <Button className="mt-4" onClick={saveGlobalPlans} isLoading={isSaving}>
          <Save className="h-4 w-4" /> Save global pricing
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-medium text-paper">Custom pricing for a specific store</h2>
        <p className="mt-1 text-xs text-muted">
          Override the global price for one store owner — e.g. a promotional rate or a bigger store
          paying more.
        </p>

        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={storeSearch}
            onChange={(e) => {
              setStoreSearch(e.target.value);
              setSelectedStore(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && searchStores()}
            placeholder="Search store by name..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-20 text-sm text-paper placeholder:text-faint focus:border-mango focus:outline-none"
          />
          <button
            onClick={searchStores}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-mango px-2.5 py-1 text-xs font-medium text-base"
          >
            Search
          </button>
        </div>

        {storeResults.length > 0 && (
          <div className="mt-2 space-y-1 rounded-lg border border-border p-2">
            {storeResults.map((s) => (
              <button
                key={s._id}
                onClick={() => selectStore(s)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-paper hover:bg-surface"
              >
                {s.name}
                <Badge variant="neutral">{s.approvalStatus}</Badge>
              </button>
            ))}
          </div>
        )}

        {selectedStore && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm text-paper">
              Setting custom prices for <span className="font-medium">{selectedStore.name}</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {CYCLES.map((cycle) => (
                <div key={cycle}>
                  <Input
                    label={`${CYCLE_LABEL[cycle]} (৳)`}
                    type="number"
                    value={overrides[cycle]}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, [cycle]: e.target.value }))}
                    placeholder="Uses global price"
                  />
                  {overrides[cycle] !== '' && (
                    <button
                      onClick={() => clearOverride(cycle)}
                      className="mt-1 text-xs text-faint hover:text-chili"
                    >
                      Remove override
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={saveOverrides} isLoading={isSavingOverride}>
              <Save className="h-4 w-4" /> Save custom pricing
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
