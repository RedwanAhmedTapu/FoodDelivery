import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, MapPin } from 'lucide-react';
import { Store } from '@/types';
import { Badge } from '@/components/ui/Primitives';

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link href={`/stores/${store.slug}`} className="group block">
      <div className="ticket-notch overflow-hidden rounded-2xl border border-border bg-card shadow-ticket transition-transform group-hover:-translate-y-0.5">
        <div className="relative h-36 w-full bg-surface">
          {store.coverImage?.url ? (
            <Image
              src={store.coverImage.url}
              alt={store.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-2xl text-faint">
              {store.name.slice(0, 1)}
            </div>
          )}
          {!store.isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-base/70">
              <Badge variant="chili">Closed now</Badge>
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-medium text-paper">{store.name}</h3>
            <span className="flex items-center gap-1 whitespace-nowrap font-mono text-xs text-mango">
              <Star className="h-3.5 w-3.5 fill-mango" />
              {store.rating.toFixed(1)}
            </span>
          </div>
          <p className="line-clamp-1 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {store.address}
          </p>
          <p className="flex items-center gap-1 text-xs text-faint">
            <Clock className="h-3.5 w-3.5" /> {store.estimatedDeliveryTime} min &middot; min order ৳
            {store.minimumOrder}
          </p>
        </div>
      </div>
    </Link>
  );
}
