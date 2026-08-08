'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '@/lib/endpoints/stores';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';
import { getCurrentPosition } from '@/lib/utils';

export default function NewStorePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    minimumOrder: 0,
    estimatedDeliveryTime: 30,
  });
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function detectLocation() {
    try {
      const { coords } = await getCurrentPosition();
      setCoordinates(coords);
      toast.success('Location captured');
    } catch {
      toast.error('Could not detect location');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coordinates) return toast.error('Set the store location first');

    setIsSubmitting(true);
    try {
      const store = await storesApi.create({ ...form, coordinates });
      toast.success('Store created — awaiting admin approval');
      router.push('/dashboard/shop-owner/stores');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create store'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-lg p-6">
      <h2 className="font-medium text-paper">Create a new store</h2>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Input label="Store name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <Textarea
          label="Address"
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
            <MapPin className="h-4 w-4" /> Set store location
          </Button>
          {coordinates && (
            <span className="font-mono text-xs text-faint">
              {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Minimum order (৳)"
            type="number"
            value={form.minimumOrder}
            onChange={(e) => setForm({ ...form, minimumOrder: Number(e.target.value) })}
          />
          <Input
            label="Est. delivery (min)"
            type="number"
            value={form.estimatedDeliveryTime}
            onChange={(e) => setForm({ ...form, estimatedDeliveryTime: Number(e.target.value) })}
          />
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create store
        </Button>
      </form>
    </Card>
  );
}
