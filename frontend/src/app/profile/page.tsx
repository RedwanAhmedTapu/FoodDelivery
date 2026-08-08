'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthGate } from '@/lib/useRequireAuth';
import { authApi } from '@/lib/endpoints/auth';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';

function ProfileContent() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  async function saveProfile() {
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({ name, address });
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function changePassword() {
    setIsChangingPw(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsChangingPw(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-paper">Your profile</h1>

      <Card className="mt-6 space-y-4 p-5">
        <h2 className="font-medium text-paper">Account details</h2>
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={user.email} disabled />
        <Input label="Phone" value={user.phone} disabled />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button isLoading={isSaving} onClick={saveProfile}>
          Save changes
        </Button>
      </Card>

      <Card className="mt-4 space-y-4 p-5">
        <h2 className="font-medium text-paper">Change password</h2>
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button isLoading={isChangingPw} onClick={changePassword} variant="outline">
          Update password
        </Button>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGate>
      <ProfileContent />
    </AuthGate>
  );
}
