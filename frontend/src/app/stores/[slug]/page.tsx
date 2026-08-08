'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, MapPin, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '@/lib/endpoints/stores';
import { foodsApi } from '@/lib/endpoints/foods';
import { Store, Food } from '@/types';
import { FoodCard } from '@/components/food/FoodCard';
import { FoodPickerModal } from '@/components/food/FoodPickerModal';
import { Spinner, EmptyState, Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { apiErrorMessage } from '@/lib/api';

export default function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem, clear } = useCartStore();

  const [store, setStore] = useState<Store | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'price_asc' | 'price_desc'>('popularity');
  const [isLoading, setIsLoading] = useState(true);
  const [pickerFood, setPickerFood] = useState<Food | null>(null);
  const [conflictFood, setConflictFood] = useState<Food | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const s = await storesApi.getBySlug(slug);
        setStore(s);
        const { items } = await foodsApi.listByStore(s._id, { limit: 100, isActive: 'true' });
        setFoods(items);
      } catch {
        toast.error('Store not found');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug]);

  const sortedFoods = useMemo(() => {
    const copy = [...foods];
    switch (sortBy) {
      case 'rating':
        return copy.sort((a, b) => b.rating - a.rating);
      case 'price_asc':
        return copy.sort((a, b) => (a.effectivePrice ?? a.price) - (b.effectivePrice ?? b.price));
      case 'price_desc':
        return copy.sort((a, b) => (b.effectivePrice ?? b.price) - (a.effectivePrice ?? a.price));
      case 'popularity':
      default:
        return copy.sort((a, b) => b.totalOrders - a.totalOrders);
    }
  }, [foods, sortBy]);

  function handleAddClick(food: Food) {
    if (!user) {
      router.push(`/login?redirect=/stores/${slug}`);
      return;
    }
    if (user.role !== 'CUSTOMER') {
      toast.error('Only customer accounts can order food');
      return;
    }
    setPickerFood(food);
  }

  async function confirmAdd(
    food: Food,
    opts: { quantity: number; variantName?: string; addonNames: string[]; notes?: string },
    forceReplace = false
  ) {
    try {
      const result = await addItem({
        foodId: food._id,
        quantity: opts.quantity,
        variantName: opts.variantName,
        addonNames: opts.addonNames,
        notes: opts.notes,
        forceReplace,
      });
      if (result.conflict) {
        setPickerFood(null);
        setConflictFood(food);
        return;
      }
      setPickerFood(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add item'));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!store) {
    return <EmptyState title="Store not found" description="This store may have been removed." />;
  }

  return (
    <div>
      <div className="relative h-48 w-full bg-surface md:h-64">
        {store.coverImage?.url && (
          <Image src={store.coverImage.url} alt={store.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="-mt-10 flex items-end gap-4">
          <div className="ticket-notch h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-base bg-card shadow-ticket">
            {store.logo?.url ? (
              <Image src={store.logo.url} alt={store.name} width={80} height={80} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-2xl text-faint">
                {store.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-paper">{store.name}</h1>
            {!store.isActive && <Badge variant="chili">Closed now</Badge>}
          </div>
          {store.description && <p className="mt-2 max-w-2xl text-muted">{store.description}</p>}

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-faint">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-mango text-mango" /> {store.rating.toFixed(1)} (
              {store.totalRatings})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {store.estimatedDeliveryTime} min
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {store.address}
            </span>
          </div>
        </div>

        <div className="my-8 h-px bg-border" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-paper">Menu</h2>
          {foods.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-paper focus:border-mango focus:outline-none"
            >
              <option value="popularity">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          )}
        </div>
        {foods.length === 0 ? (
          <EmptyState title="No items yet" description="This store hasn't added any food yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2">
            {sortedFoods.map((food) => (
              <FoodCard key={food._id} food={food} onAdd={handleAddClick} />
            ))}
          </div>
        )}
      </div>

      {pickerFood && (
        <FoodPickerModal
          food={pickerFood}
          onClose={() => setPickerFood(null)}
          onConfirm={(opts) => confirmAdd(pickerFood, opts)}
        />
      )}

      {conflictFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-mango" />
            <p className="mt-3 font-display text-lg text-paper">Start a new cart?</p>
            <p className="mt-1 text-sm text-muted">
              Your cart has items from another store. Adding this item will clear it.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConflictFood(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  await clear();
                  const food = conflictFood;
                  setConflictFood(null);
                  setPickerFood(food);
                }}
              >
                Clear & continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
