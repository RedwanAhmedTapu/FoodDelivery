'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi } from '@/lib/endpoints/misc';
import { DeliveryBoyProfile } from '@/types';
import { Card, Badge, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { apiErrorMessage } from '@/lib/api';

const statusVariant: Record<string, 'neutral' | 'mango' | 'chili'> = {
  PENDING: 'neutral',
  APPROVED: 'mango',
  SUSPENDED: 'chili',
};

const statusMessage: Record<string, string> = {
  PENDING: 'Your account is awaiting admin approval. Fill in your details below so the admin can review and approve you.',
  APPROVED: 'Your account is approved — keep your details up to date.',
  SUSPENDED: 'Your account has been suspended. Contact support for help.',
};

export default function DeliveryProfilePage() {
  const [profile, setProfile] = useState<DeliveryBoyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    licenseInformation: '',
  });

  useEffect(() => {
    deliveryApi
      .myProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          name: p.name || '',
          phone: p.phone || '',
          vehicleType: p.vehicleType || 'BIKE',
          vehicleNumber: p.vehicleNumber || '',
          licenseInformation: p.licenseInformation || '',
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function saveProfile() {
    setIsSaving(true);
    try {
      const updated = await deliveryApi.updateProfile(form);
      setProfile(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const updated = await deliveryApi.uploadProfileImage(file);
      setProfile(updated);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setIsUploadingImage(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-dashed border-border bg-surface"
            title="Upload profile photo"
          >
            {profile.profileImage?.url ? (
              <Image src={profile.profileImage.url} alt="Profile" fill className="object-cover" />
            ) : (
              <UserIcon className="m-auto h-8 w-8 text-faint" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {isUploadingImage ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Camera className="h-5 w-5 text-paper" />
              )}
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-paper">{profile.name}</p>
              <Badge variant={statusVariant[profile.status]}>{profile.status}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {profile.totalDeliveries} deliveries &middot; tap photo to change
            </p>
          </div>
        </div>

        {statusMessage[profile.status] && (
          <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
            {statusMessage[profile.status]}
          </p>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-medium text-paper">Your details</h2>
        <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Vehicle type"
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
          >
            <option value="BIKE">Bike</option>
            <option value="BICYCLE">Bicycle</option>
            <option value="CAR">Car</option>
            <option value="ON_FOOT">On foot</option>
          </Select>
          <Input
            label="Vehicle number (optional)"
            placeholder="e.g. DHA-1234"
            value={form.vehicleNumber}
            onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
          />
        </div>
        <Textarea
          label="License / ID information"
          hint="Driving license or NID number — helps admin verify your account."
          rows={2}
          value={form.licenseInformation}
          onChange={(e) => setForm({ ...form, licenseInformation: e.target.value })}
        />
        <Button className="w-full" isLoading={isSaving} onClick={saveProfile}>
          Save changes
        </Button>
      </Card>
    </div>
  );
}
