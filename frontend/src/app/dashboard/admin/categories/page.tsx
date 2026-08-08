'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Trash2, ImagePlus } from 'lucide-react';
import { categoriesApi } from '@/lib/endpoints/categories';
import { FoodCategory } from '@/types';
import { Card, Badge, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { apiErrorMessage } from '@/lib/api';

// Cloudinary auto-crops/resizes on delivery, but the source image should
// still be roughly this shape for it to look right in category chips/grids.
const RECOMMENDED_SIZE = '512×512px, square, under 1MB';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCategoryId = useRef<string | null>(null);

  function load() {
    categoriesApi.list({ limit: 100 }).then(setCategories).finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const category = await categoriesApi.create({ name: newName });
      setCategories((prev) => [...prev, category]);
      setNewName('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleActive(category: FoodCategory) {
    const updated = await categoriesApi.setActive(category._id, !category.isActive);
    setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
  }

  async function remove(category: FoodCategory) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await categoriesApi.remove(category._id);
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete — foods may still reference this category'));
    }
  }

  function triggerUpload(categoryId: string) {
    pendingCategoryId.current = categoryId;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const categoryId = pendingCategoryId.current;
    if (!file || !categoryId) return;

    setUploadingFor(categoryId);
    try {
      const updated = await categoriesApi.uploadImage(categoryId, file);
      setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      toast.success('Category image updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploadingFor(null);
    }
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      <Card className="mb-5 p-4">
        <form onSubmit={createCategory} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Biryani"
            className="flex-1"
          />
          <Button type="submit" isLoading={isCreating}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
        <p className="mt-2 text-xs text-faint">Recommended image size: {RECOMMENDED_SIZE}</p>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat._id} className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => triggerUpload(cat._id)}
                  disabled={uploadingFor === cat._id}
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-dashed border-border bg-surface"
                  title="Upload category image"
                >
                  {cat.image?.url ? (
                    <Image src={cat.image.url} alt={cat.name} fill className="object-cover" />
                  ) : (
                    <ImagePlus className="m-auto h-4 w-4 text-faint" />
                  )}
                </button>
                <span className="text-paper">{cat.name}</span>
                {!cat.isActive && <Badge variant="chili">Hidden</Badge>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive(cat)}>
                  {cat.isActive ? 'Hide' : 'Show'}
                </Button>
                <button onClick={() => remove(cat)} className="p-1.5 text-faint hover:text-chili">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
