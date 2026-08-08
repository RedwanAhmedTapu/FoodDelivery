'use client';

import Image from 'next/image';
import { Plus, Star } from 'lucide-react';
import { Food } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function FoodCard({ food, onAdd }: { food: Food; onAdd: (food: Food) => void }) {
  const hasDiscount = food.discountPrice != null && food.discountPrice < food.price;

  return (
    <div className="ticket-notch flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-ticket">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface">
        {food.images?.[0]?.url ? (
          <Image src={food.images[0].url} alt={food.name} fill className="object-cover" sizes="96px" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-xl text-faint">
            {food.name.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate font-medium text-paper">{food.name}</h4>
            {food.rating > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 font-mono text-xs text-mango">
                <Star className="h-3 w-3 fill-mango" /> {food.rating.toFixed(1)}
              </span>
            )}
          </div>
          {food.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{food.description}</p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-sm font-semibold text-paper">
              {formatCurrency(hasDiscount ? food.discountPrice! : food.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-faint line-through">{formatCurrency(food.price)}</span>
            )}
          </div>
          <button
            onClick={() => onAdd(food)}
            disabled={!food.availability}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-mango text-base transition-transform hover:scale-105 disabled:opacity-40"
            aria-label={`Add ${food.name} to cart`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
