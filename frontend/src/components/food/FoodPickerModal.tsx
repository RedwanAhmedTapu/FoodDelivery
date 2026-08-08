'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Food } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { formatCurrency } from '@/lib/utils';

export function FoodPickerModal({
  food,
  onClose,
  onConfirm,
}: {
  food: Food;
  onClose: () => void;
  onConfirm: (opts: { quantity: number; variantName?: string; addonNames: string[]; notes?: string }) => void;
}) {
  const [variantName, setVariantName] = useState(food.variants[0]?.name);
  const [addonNames, setAddonNames] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const basePrice = food.discountPrice != null && food.discountPrice < food.price ? food.discountPrice : food.price;
  const variantMod = food.variants.find((v) => v.name === variantName)?.priceModifier || 0;
  const addonsTotal = addonNames.reduce(
    (sum, name) => sum + (food.addons.find((a) => a.name === name)?.price || 0),
    0
  );
  const unitTotal = basePrice + variantMod + addonsTotal;

  function toggleAddon(name: string) {
    setAddonNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-base/80 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="relative h-40 w-full bg-surface">
          {food.images?.[0]?.url && (
            <Image src={food.images[0].url} alt={food.name} fill className="object-cover" />
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-base/70 text-paper"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h3 className="font-display text-xl text-paper">{food.name}</h3>
            {food.description && <p className="mt-1 text-sm text-muted">{food.description}</p>}
          </div>

          {food.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-paper">Choose size</p>
              <div className="flex flex-wrap gap-2">
                {food.variants.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setVariantName(v.name)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm ${
                      variantName === v.name
                        ? 'border-mango bg-mango-soft text-mango'
                        : 'border-border text-muted hover:border-mango/50'
                    }`}
                  >
                    {v.name} {v.priceModifier > 0 && `+${formatCurrency(v.priceModifier)}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {food.addons.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-paper">Add extras</p>
              <div className="space-y-2">
                {food.addons.map((a) => (
                  <label
                    key={a.name}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2 text-paper">
                      <input
                        type="checkbox"
                        checked={addonNames.includes(a.name)}
                        onChange={() => toggleAddon(a.name)}
                        className="accent-mango"
                      />
                      {a.name}
                    </span>
                    <span className="font-mono text-xs text-muted">+{formatCurrency(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Textarea
            label="Special instructions (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. less spicy, no onions"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1.5">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="text-lg text-muted">
                –
              </button>
              <span className="w-4 text-center font-mono">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="text-lg text-mango">
                +
              </button>
            </div>
            <span className="font-mono text-lg font-semibold text-paper">
              {formatCurrency(unitTotal * quantity)}
            </span>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => onConfirm({ quantity, variantName, addonNames, notes: notes || undefined })}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
