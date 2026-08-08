'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Store as StoreIcon } from 'lucide-react';
import { storesApi } from '@/lib/endpoints/stores';
import { Store } from '@/types';
import { StoreCard } from '@/components/store/StoreCard';
import { Spinner, EmptyState } from '@/components/ui/Primitives';

export default function StoresPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
      <StoresPageContent />
    </Suspense>
  );
}

function StoresPageContent() {
  const searchParams = useSearchParams();
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    storesApi
      .list({ search: search || undefined, limit: 24 })
      .then(({ items }) => setStores(items))
      .finally(() => setIsLoading(false));
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-paper">Browse stores</h1>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores..."
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-paper placeholder:text-faint focus:border-mango focus:outline-none"
        />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="No stores found"
            description="Try a different search term or check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((store) => (
              <StoreCard key={store._id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
