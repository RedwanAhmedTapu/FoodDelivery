'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, ArrowRight, Star, History, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { storesApi } from '@/lib/endpoints/stores';
import { categoriesApi } from '@/lib/endpoints/categories';
import { recommendationsApi } from '@/lib/endpoints/misc';
import { ordersApi } from '@/lib/endpoints/orders';
import { foodsApi } from '@/lib/endpoints/foods';
import { Store, FoodCategory, Food } from '@/types';
import { StoreCard } from '@/components/store/StoreCard';
import { Spinner } from '@/components/ui/Primitives';
import { getCurrentPosition, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

function FoodStrip({ title, icon: Icon, foods }: { title: string; icon: typeof Star; foods: Food[] }) {
  if (foods.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-paper">
        <Icon className="h-5 w-5 text-mango" /> {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {foods.map((food) => {
          const store = typeof food.storeId === 'object' ? (food.storeId as Store) : null;
          const price = food.discountPrice != null && food.discountPrice < food.price ? food.discountPrice : food.price;
          return (
            <Link
              key={food._id}
              href={store ? `/stores/${store.slug}` : '/stores'}
              className="ticket-notch w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-ticket"
            >
              <div className="relative h-28 w-full bg-surface">
                {food.images?.[0]?.url ? (
                  <Image src={food.images[0].url} alt={food.name} fill className="object-cover" sizes="160px" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-xl text-faint">
                    {food.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-paper">{food.name}</p>
                <p className="truncate text-xs text-faint">{store?.name}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-paper">{formatCurrency(price)}</span>
                  {food.rating > 0 && (
                    <span className="flex items-center gap-0.5 font-mono text-[11px] text-mango">
                      <Star className="h-3 w-3 fill-mango" /> {food.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Dhaka, Bangladesh');

  useEffect(() => {
    (async () => {
      const [cats] = await Promise.all([categoriesApi.listActive()]);
      setCategories(cats);

      try {
        const { coords } = await getCurrentPosition();
        const { items } = await storesApi.nearby(coords[0], coords[1], 8);
        setStores(items);
        setLocationLabel('Near you');
      } catch {
        const { items } = await storesApi.list({ limit: 8 });
        setStores(items);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Personalized sections — only meaningful for logged-in customers with
  // order history, so the recommendation engine has something to work with.
  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') return;

    recommendationsApi
      .foods(8)
      .then(setRecommendedFoods)
      .catch(() => {});

    // "Order this again" — built from the customer's own delivered order
    // history (foods they've actually eaten most, most recently first),
    // rather than a dedicated endpoint.
    ordersApi
      .mine({ limit: 20 })
      .then(async ({ items }) => {
        const frequency = new Map<string, number>(); // foodId -> total quantity
        const lastOrdered = new Map<string, number>(); // foodId -> most recent order timestamp

        items
          .filter((o) => o.orderStatus === 'DELIVERED')
          .forEach((order) => {
            const orderedAt = new Date(order.createdAt).getTime();
            order.items.forEach((item) => {
              frequency.set(item.foodId, (frequency.get(item.foodId) || 0) + item.quantity);
              if (!lastOrdered.has(item.foodId) || orderedAt > lastOrdered.get(item.foodId)!) {
                lastOrdered.set(item.foodId, orderedAt);
              }
            });
          });

        // Rank by how often they order it, then how recently.
        const topFoodIds = [...frequency.keys()]
          .sort((a, b) => frequency.get(b)! - frequency.get(a)! || lastOrdered.get(b)! - lastOrdered.get(a)!)
          .slice(0, 8);

        if (topFoodIds.length === 0) return;

        const resolved = await Promise.all(
          topFoodIds.map((id) => foodsApi.getById(id).catch(() => null))
        );
        setRecentFoods(resolved.filter((f): f is Food => f !== null && f.isActive));
      })
      .catch(() => {});
  }, [user]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/stores?search=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-mango">
            <MapPin className="h-3.5 w-3.5" /> {locationLabel}
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-medium leading-[1.1] text-paper md:text-6xl">
            Your city's best kitchens, <span className="text-mango">tracked door to door.</span>
          </h1>
          <p className="mt-5 max-w-lg text-muted">
            Order from local stores, watch your rider's route in real time, and earn points every
            time you eat.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search biryani, burgers, stores..."
                className="w-full rounded-full border border-border bg-surface py-3 pl-10 pr-4 text-sm text-paper placeholder:text-faint focus:border-mango focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full bg-mango px-5 py-3 text-sm font-medium text-base"
            >
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Category chips */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/stores?categoryId=${cat._id}`}
                className="ticket-notch shrink-0 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-paper hover:border-mango"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Personalized: based on what this customer orders most / rates highly */}
      <FoodStrip title="Picked for you" icon={Sparkles} foods={recommendedFoods} />
      <FoodStrip title="Order this again" icon={History} foods={recentFoods} />

      {/* Stores */}
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-paper">Stores {locationLabel}</h2>
          <Link href="/stores" className="text-sm text-mango hover:underline">
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((store) => (
              <StoreCard key={store._id} store={store} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
