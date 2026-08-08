'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '@/lib/endpoints/stores';
import { foodsApi } from '@/lib/endpoints/foods';
import { categoriesApi } from '@/lib/endpoints/categories';
import { Store, FoodCategory } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';
import { apiErrorMessage } from '@/lib/api';

export default function NewFoodPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [form, setForm] = useState({
    storeId: '',
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    discountPrice: undefined as number | undefined,
    preparationTime: 15,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([storesApi.myStores(), categoriesApi.listActive()]).then(([s, c]) => {
      setStores(s);
      setCategories(c);
      if (s.length) setForm((f) => ({ ...f, storeId: s[0]._id }));
      if (c.length) setForm((f) => ({ ...f, categoryId: c[0]._id }));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const food = await foodsApi.create(form);
      if (images.length > 0) {
        await foodsApi.uploadImages(food._id, images).catch(() => {
          toast.error('Food was created, but images failed to upload — add them from the menu list.');
        });
      }
      toast.success('Food added to menu');
      router.push('/dashboard/shop-owner/foods');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add food'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file later
    setImages((prev) => {
      const combined = [...prev, ...picked].slice(0, 5); // matches backend's 5-image cap
      setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
  }

  function removeImageAt(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mango-soft text-mango">
          <UtensilsCrossed className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="font-display text-xl text-paper">Add a new item</h1>
          <p className="text-xs text-muted">Fill in the details below — it'll appear on your menu right away.</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-medium text-paper">Where does this go?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Store"
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              >
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Category"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-3 text-sm font-medium text-paper">Item details</h2>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g. Chicken Biryani"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Textarea
                label="Description"
                placeholder="A short, appetizing description customers will see"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Price (৳)"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Discount price (optional)"
                  type="number"
                  value={form.discountPrice ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, discountPrice: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                <Input
                  label="Prep time (mins)"
                  type="number"
                  value={form.preparationTime}
                  onChange={(e) => setForm({ ...form, preparationTime: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-1 text-sm font-medium text-paper">Photos</h2>
            <p className="mb-3 text-xs text-muted">Add up to 5 photos. The first one is used as the cover image.</p>

            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-paper opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-mango/90 py-0.5 text-center text-[10px] font-medium text-base">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {imagePreviews.length < 5 && (
                <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-faint hover:border-mango hover:text-mango">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImagesSelected} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Add to menu
          </Button>
        </form>
      </Card>
    </div>
  );
}
