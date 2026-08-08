'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { foodsApi } from '@/lib/endpoints/foods';
import { categoriesApi } from '@/lib/endpoints/categories';
import { Food, FoodCategory } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Card, Spinner } from '@/components/ui/Primitives';
import { apiErrorMessage } from '@/lib/api';

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const foodId = params.id;

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; publicId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    discountPrice: undefined as number | undefined,
    preparationTime: 15,
    stock: undefined as number | undefined,
  });

  useEffect(() => {
    Promise.all([foodsApi.getById(foodId), categoriesApi.listActive()])
      .then(([food, cats]) => {
        setCategories(cats);
        setExistingImages(food.images || []);
        setForm({
          categoryId: typeof food.categoryId === 'object' ? food.categoryId._id : food.categoryId,
          name: food.name,
          description: food.description || '',
          price: food.price,
          discountPrice: food.discountPrice ?? undefined,
          preparationTime: food.preparationTime,
          stock: food.stock ?? undefined,
        });
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load item')))
      .finally(() => setIsLoading(false));
  }, [foodId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await foodsApi.update(foodId, form);
      if (newImages.length > 0) {
        await foodsApi.uploadImages(foodId, newImages).catch(() => {
          toast.error('Details saved, but new photos failed to upload.');
        });
      }
      toast.success('Item updated');
      router.push('/dashboard/shop-owner/foods');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update item'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const remainingSlots = Math.max(0, 5 - existingImages.length - newImages.length);
    const toAdd = picked.slice(0, remainingSlots);
    if (toAdd.length === 0) return;
    setNewImages((prev) => {
      const combined = [...prev, ...toAdd];
      setNewImagePreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
  }

  function removeNewImageAt(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const totalImageCount = existingImages.length + newImages.length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/shop-owner/foods"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-paper"
      >
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </Link>

      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mango-soft text-mango">
          <Pencil className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="font-display text-xl text-paper">Edit item</h1>
          <p className="text-xs text-muted">Update details and photos for this menu item.</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-medium text-paper">Item details</h2>
            <div className="space-y-4">
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
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Textarea
                label="Description"
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
              <Input
                label="Stock (optional, leave blank for unlimited)"
                type="number"
                value={form.stock ?? ''}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-1 text-sm font-medium text-paper">Photos</h2>
            <p className="mb-3 text-xs text-muted">Up to 5 photos total. New photos are added to the existing ones.</p>

            <div className="flex flex-wrap gap-3">
              {existingImages.map((img, i) => (
                <div key={img.publicId || i} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-mango/90 py-0.5 text-center text-[10px] font-medium text-base">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {newImagePreviews.map((src, i) => (
                <div key={`new-${i}`} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-mango/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`New photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImageAt(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-paper opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-mango/90 py-0.5 text-center text-[10px] font-medium text-base">
                    New
                  </span>
                </div>
              ))}

              {totalImageCount < 5 && (
                <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-faint hover:border-mango hover:text-mango">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImagesSelected} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" size="lg" isLoading={isSubmitting}>
              Save changes
            </Button>
            <Link href="/dashboard/shop-owner/foods" className="flex-1">
              <Button type="button" variant="outline" className="w-full" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
