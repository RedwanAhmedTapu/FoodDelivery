'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User as UserIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/endpoints/misc';
import { ShopOwnerProfile } from '@/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/api';

const approvalVariant: Record<string, 'neutral' | 'mango' | 'chili'> = {
  PENDING: 'neutral',
  APPROVED: 'mango',
  REJECTED: 'chili',
};

const DOCUMENT_LABEL: Record<string, string> = {
  TRADE_LICENSE: 'Trade license',
  NID: 'NID',
  TIN: 'TIN certificate',
  OTHER: 'Document',
};

export default function AdminShopOwnersPage() {
  const [owners, setOwners] = useState<ShopOwnerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    adminApi.listShopOwners({ limit: 100 }).then(({ items }) => setOwners(items)).finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function decide(owner: ShopOwnerProfile, approvalStatus: 'APPROVED' | 'REJECTED') {
    try {
      const reason = approvalStatus === 'REJECTED' ? window.prompt('Rejection reason?') || undefined : undefined;
      const updated = await adminApi.setShopOwnerApproval(owner._id, approvalStatus, reason);
      setOwners((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success(`Shop owner ${approvalStatus.toLowerCase()}`);
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

  if (owners.length === 0) return <EmptyState title="No shop owners yet" />;

  return (
    <div className="space-y-3">
      {owners.map((owner) => (
        <Card key={owner._id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
                {owner.profileImage?.url ? (
                  <Image src={owner.profileImage.url} alt={owner.businessName} fill className="object-cover" />
                ) : (
                  <UserIcon className="m-auto mt-3.5 h-7 w-7 text-faint" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-paper">{owner.businessName}</p>
                  <Badge variant={approvalVariant[owner.approvalStatus]}>{owner.approvalStatus}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {owner.ownerName} &middot; {owner.email}
                </p>
                {owner.address && <p className="mt-0.5 text-xs text-faint">{owner.address}</p>}
              </div>
            </div>
            {owner.approvalStatus === 'PENDING' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(owner, 'APPROVED')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => decide(owner, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
              <FileText className="h-3.5 w-3.5" /> Verification documents
            </p>
            {owner.documents && owner.documents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {owner.documents.map((doc) => (
                  <a
                    key={doc.type}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-surface"
                    title={DOCUMENT_LABEL[doc.type] || doc.type}
                  >
                    <Image src={doc.url} alt={doc.type} fill className="object-cover" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-paper">
                      {DOCUMENT_LABEL[doc.type] || doc.type}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-faint">No documents uploaded yet.</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
