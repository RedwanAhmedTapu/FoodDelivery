'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Star, AlertTriangle, CreditCard, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '@/lib/endpoints/stores';
import { Store } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/api';

const approvalVariant: Record<string, 'neutral' | 'mango' | 'chili'> = {
  PENDING: 'neutral',
  APPROVED: 'mango',
  REJECTED: 'chili',
};

const OFF_REASON_MESSAGE: Record<string, string> = {
  PENDING_APPROVAL: 'Awaiting admin approval before it can go live.',
  REJECTED: 'Your store was rejected by admin.',
  SUBSCRIPTION_REQUIRED: 'No active subscription yet — subscribe to a plan to go live.',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Renew to reactivate.',
  ADMIN_SUSPENDED: 'Suspended by admin.',
  OWNER_DEACTIVATED: 'Manually turned off. Activate it whenever you\'re ready.',
};

const SUBSCRIPTION_RELATED = new Set(['SUBSCRIPTION_REQUIRED', 'SUBSCRIPTION_EXPIRED']);

export default function MyStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ storeId: string; field: 'logo' | 'cover' } | null>(null);

  function load() {
    storesApi.myStores().then(setStores).finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(store: Store) {
    try {
      const updated = store.isActive ? await storesApi.deactivate(store._id) : await storesApi.activate(store._id);
      setStores((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      toast.success(updated.isActive ? 'Store activated' : 'Store deactivated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function triggerUpload(storeId: string, field: 'logo' | 'cover') {
    setPendingUpload({ storeId, field });
    (field === 'logo' ? logoInputRef : coverInputRef).current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !pendingUpload) return;

    setUploadingFor(pendingUpload.storeId);
    try {
      const updated =
        pendingUpload.field === 'logo'
          ? await storesApi.uploadLogo(pendingUpload.storeId, file)
          : await storesApi.uploadCover(pendingUpload.storeId, file);
      setStores((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      toast.success(`${pendingUpload.field === 'logo' ? 'Logo' : 'Banner'} updated`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploadingFor(null);
      setPendingUpload(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-medium text-paper">My stores</h2>
        <Link href="/dashboard/shop-owner/stores/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New store
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : stores.length === 0 ? (
        <EmptyState
          title="No stores yet"
          description="Create your first store to start selling."
          action={
            <Link href="/dashboard/shop-owner/stores/new">
              <Button>Create store</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

          {stores.map((store) => {
            const reason = store.deactivationReason && store.deactivationReason !== 'NONE' ? store.deactivationReason : null;
            const canActivate = store.approvalStatus === 'APPROVED' && store.subscriptionStatus === 'ACTIVE';
            const isUploadingThis = uploadingFor === store._id;

            return (
              <Card key={store._id} className="p-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => triggerUpload(store._id, 'logo')}
                    disabled={isUploadingThis}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-dashed border-border bg-surface"
                    title="Upload logo"
                  >
                    {store.logo?.url ? (
                      <Image src={store.logo.url} alt="Logo" fill className="object-cover" />
                    ) : (
                      <ImagePlus className="m-auto h-4 w-4 text-faint" />
                    )}
                  </button>
                  <button
                    onClick={() => triggerUpload(store._id, 'cover')}
                    disabled={isUploadingThis}
                    className="relative h-14 flex-1 overflow-hidden rounded-xl border border-dashed border-border bg-surface"
                    title="Upload banner image"
                  >
                    {store.coverImage?.url ? (
                      <Image src={store.coverImage.url} alt="Banner" fill className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center gap-1.5 text-xs text-faint">
                        <ImagePlus className="h-3.5 w-3.5" /> Upload banner
                      </span>
                    )}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-paper">{store.name}</p>
                      <Badge variant={approvalVariant[store.approvalStatus]}>{store.approvalStatus}</Badge>
                      {store.isActive && <Badge variant="mango">Live</Badge>}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Star className="h-3 w-3 fill-mango text-mango" /> {store.rating.toFixed(1)} &middot;{' '}
                      {store.totalOrders} orders
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={store.isActive ? 'outline' : 'primary'}
                    disabled={!store.isActive && !canActivate}
                    onClick={() => toggleActive(store)}
                  >
                    {store.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>

                {!store.isActive && reason && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-chili/30 bg-chili-soft p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-chili" />
                    <div className="flex-1">
                      <p className="text-sm text-chili">
                        Store is off: {OFF_REASON_MESSAGE[reason] || reason}
                      </p>
                      {SUBSCRIPTION_RELATED.has(reason) && (
                        <Link
                          href="/dashboard/shop-owner/subscription"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-mango hover:underline"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Go to Subscription
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
