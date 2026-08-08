'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '@/lib/endpoints/stores';
import { foodsApi } from '@/lib/endpoints/foods';
import { Food, Store } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

export default function MyFoodsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    foodsApi
      .listByStore(selectedStoreId, { limit: 100 })
      .then(({ items }) => setFoods(items))
      .finally(() => setIsLoading(false));
  }, [selectedStoreId]);

  async function toggleActive(food: Food) {
    try {
      const updated = await foodsApi.setActive(food._id, !food.isActive);
      setFoods((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (stores.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="Create a store first"
        description="You need at least one store before adding food."
        action={
          <Link href="/dashboard/shop-owner/stores/new">
            <Button>Create store</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="max-w-xs"
        >
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Link href="/dashboard/shop-owner/foods/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add food
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : foods.length === 0 ? (
        <EmptyState title="No food items yet" description="Add your first menu item." />
      ) : (
        <div className="space-y-2">
          {foods.map((food) => (
            <Card key={food._id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                  {food.images?.[0]?.url ? (
                    <Image src={food.images[0].url} alt={food.name} fill className="object-cover" />
                  ) : (
                    <UtensilsCrossed className="m-auto mt-3 h-6 w-6 text-faint" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-paper">{food.name}</p>
                    {!food.isActive && <Badge variant="chili">Hidden</Badge>}
                    {food.stock !== null && food.stock <= 5 && (
                      <Badge variant="chili">{food.stock} left</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted">{formatCurrency(food.price)}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/dashboard/shop-owner/foods/${food._id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                <Button size="sm" variant={food.isActive ? 'outline' : 'primary'} onClick={() => toggleActive(food)}>
                  {food.isActive ? 'Hide' : 'Show'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
