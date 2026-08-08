'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi, AuthPayload } from '@/lib/endpoints/auth';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';

type RoleTab = 'CUSTOMER' | 'SHOP_OWNER' | 'DELIVERY_BOY';

const tabs: { key: RoleTab; label: string; redirect: string }[] = [
  { key: 'CUSTOMER', label: 'Order food', redirect: '/' },
  { key: 'SHOP_OWNER', label: 'Sell on RickshawBites', redirect: '/dashboard/shop-owner' },
  { key: 'DELIVERY_BOY', label: 'Deliver & earn', redirect: '/dashboard/delivery' },
];

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [tab, setTab] = useState<RoleTab>('CUSTOMER');
  const [form, setForm] = useState<AuthPayload>({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const registerFn =
        tab === 'CUSTOMER'
          ? authApi.registerCustomer
          : tab === 'SHOP_OWNER'
          ? authApi.registerShopOwner
          : authApi.registerDeliveryBoy;

      const user = await registerFn(form);
      setUser(user);
      toast.success('Account created!');
      router.push(tabs.find((t) => t.key === tab)!.redirect);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create account'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-10">
      <Card className="w-full p-8">
        <h1 className="font-display text-2xl text-paper">Create your account</h1>

        <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-surface p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                tab === t.key ? 'bg-mango text-base' : 'text-muted hover:text-paper'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
          {tab === 'CUSTOMER' && (
            <Input
              label="Referral code (optional)"
              value={form.referralCode || ''}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
            />
          )}
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Create account
          </Button>
        </form>

        {tab !== 'CUSTOMER' && (
          <p className="mt-4 text-xs text-faint">
            {tab === 'SHOP_OWNER'
              ? 'Your business and stores will need admin approval before going live.'
              : 'Your delivery account will need admin approval before you can go online.'}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-mango hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
