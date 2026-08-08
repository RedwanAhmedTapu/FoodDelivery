'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/endpoints/auth';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await authApi.login(identifier, password);
      setUser(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const redirect = params.get('redirect');
      if (redirect) router.push(redirect);
      else if (user.role === 'SUPER_ADMIN') router.push('/dashboard/admin');
      else if (user.role === 'SHOP_OWNER') router.push('/dashboard/shop-owner');
      else if (user.role === 'DELIVERY_BOY') router.push('/dashboard/delivery');
      else router.push('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not log in'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4">
      <Card className="w-full p-8">
        <h1 className="font-display text-2xl text-paper">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to track your orders and points.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email or phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link href="/register" className="text-mango hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
