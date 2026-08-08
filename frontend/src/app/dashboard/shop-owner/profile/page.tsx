'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, User as UserIcon, FileText, Plus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { shopOwnerApi } from '@/lib/endpoints/misc';
import { ShopOwnerProfile } from '@/types';
import { Card, Badge, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { apiErrorMessage } from '@/lib/api';

const approvalVariant: Record<string, 'neutral' | 'mango' | 'chili'> = {
  PENDING: 'neutral',
  APPROVED: 'mango',
  REJECTED: 'chili',
};

const approvalMessage: Record<string, string> = {
  PENDING:
    'Your business is awaiting admin approval. Add a profile photo and upload your verification documents below so the admin can review and approve you.',
  APPROVED: 'Your business is approved — keep your details up to date.',
  REJECTED: 'Your application was rejected. Update your details and documents, then contact support.',
};

const DOCUMENT_TYPES = [
  { value: 'TRADE_LICENSE', label: 'Trade license' },
  { value: 'NID', label: 'National ID (NID)' },
  { value: 'TIN', label: 'TIN certificate' },
  { value: 'OTHER', label: 'Other document' },
];

export default function ShopOwnerProfilePage() {
  const [profile, setProfile] = useState<ShopOwnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ businessName: '', ownerName: '', phone: '', email: '', address: '' });

  const [docType, setDocType] = useState(DOCUMENT_TYPES[0].value);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  useEffect(() => {
    shopOwnerApi
      .myProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          businessName: p.businessName || '',
          ownerName: p.ownerName || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function saveProfile() {
    setIsSaving(true);
    try {
      const updated = await shopOwnerApi.updateProfile(form);
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
      const updated = await shopOwnerApi.uploadProfileImage(file);
      setProfile(updated);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleDocSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingDoc(true);
    try {
      const updated = await shopOwnerApi.uploadDocument(docType, file);
      setProfile(updated);
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setIsUploadingDoc(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const uploadedTypes = new Set((profile.documents || []).map((d) => d.type));

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
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
              <p className="font-medium text-paper">{profile.businessName}</p>
              <Badge variant={approvalVariant[profile.approvalStatus]}>{profile.approvalStatus}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">tap photo to change</p>
          </div>
        </div>

        {approvalMessage[profile.approvalStatus] && (
          <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
            {approvalMessage[profile.approvalStatus]}
          </p>
        )}
        {profile.approvalStatus === 'REJECTED' && profile.rejectionReason && (
          <p className="mt-2 rounded-lg border border-chili/30 bg-chili-soft p-3 text-xs text-chili">
            Reason: {profile.rejectionReason}
          </p>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-medium text-paper">Business details</h2>
        <Input
          label="Business name"
          value={form.businessName}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
        />
        <Input
          label="Owner name"
          value={form.ownerName}
          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Button className="w-full" isLoading={isSaving} onClick={saveProfile}>
          Save changes
        </Button>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-medium text-paper">
          <FileText className="h-4 w-4 text-mango" /> Verification documents
        </h2>
        <p className="text-xs text-muted">
          Upload a clear photo of your trade license, NID, or other business documents. Admin reviews these
          before approving your account.
        </p>

        <div className="flex gap-2">
          <Select value={docType} onChange={(e) => setDocType(e.target.value)} className="flex-1">
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <input
            ref={docInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleDocSelected}
          />
          <Button
            variant="outline"
            isLoading={isUploadingDoc}
            onClick={() => docInputRef.current?.click()}
          >
            <Plus className="h-4 w-4" /> Upload
          </Button>
        </div>

        {(profile.documents || []).length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {profile.documents!.map((doc) => (
              <a
                key={doc.type}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
              >
                <Image src={doc.url} alt={doc.type} fill className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-1.5 py-1 text-[10px] text-paper">
                  <CheckCircle2 className="h-3 w-3 text-delivered" />
                  {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-faint">
            No documents uploaded yet.
          </p>
        )}

        {DOCUMENT_TYPES.some((t) => !uploadedTypes.has(t.value)) && (profile.documents || []).length > 0 && (
          <p className="text-xs text-faint">Tip: you can upload more than one document type for faster review.</p>
        )}
      </Card>
    </div>
  );
}
