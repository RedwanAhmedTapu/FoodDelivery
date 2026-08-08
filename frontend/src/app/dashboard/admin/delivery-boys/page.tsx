'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User as UserIcon, Bike, Hash, IdCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi } from '@/lib/endpoints/misc';
import { DeliveryBoyProfile } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/api';

const statusVariant: Record<string, 'neutral' | 'mango' | 'chili'> = {
  PENDING: 'neutral',
  APPROVED: 'mango',
  SUSPENDED: 'chili',
};

const VEHICLE_LABEL: Record<string, string> = {
  BIKE: 'Bike',
  BICYCLE: 'Bicycle',
  CAR: 'Car',
  ON_FOOT: 'On foot',
};

export default function AdminDeliveryBoysPage() {
  const [riders, setRiders] = useState<DeliveryBoyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    deliveryApi.listAll({ limit: 100 }).then(({ items }) => setRiders(items)).finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function setStatus(rider: DeliveryBoyProfile, status: 'APPROVED' | 'SUSPENDED') {
    try {
      const updated = await deliveryApi.setApproval(rider._id, status);
      setRiders((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      toast.success(`Rider ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (riders.length === 0) return <EmptyState title="No delivery riders yet" />;

  return (
    <div className="space-y-3">
      {riders.map((rider) => (
        <Card key={rider._id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
                {rider.profileImage?.url ? (
                  <Image src={rider.profileImage.url} alt={rider.name} fill className="object-cover" />
                ) : (
                  <UserIcon className="m-auto mt-3.5 h-7 w-7 text-faint" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-paper">{rider.name}</p>
                  <Badge variant={statusVariant[rider.status]}>{rider.status}</Badge>
                  {rider.isOnline && <Badge variant="mango">Online</Badge>}
                </div>
                <p className="text-xs text-muted">
                  {rider.phone} &middot; {rider.totalDeliveries} deliveries
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5" /> {VEHICLE_LABEL[rider.vehicleType] || rider.vehicleType}
                  </span>
                  {rider.vehicleNumber && (
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" /> {rider.vehicleNumber}
                    </span>
                  )}
                  {rider.licenseInformation && (
                    <span className="flex items-center gap-1">
                      <IdCard className="h-3.5 w-3.5" /> {rider.licenseInformation}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {rider.status !== 'APPROVED' && (
                <Button size="sm" onClick={() => setStatus(rider, 'APPROVED')}>
                  Approve
                </Button>
              )}
              {rider.status !== 'SUSPENDED' && (
                <Button size="sm" variant="danger" onClick={() => setStatus(rider, 'SUSPENDED')}>
                  Suspend
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
