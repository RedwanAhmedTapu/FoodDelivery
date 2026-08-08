'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Role } from '@/types';
import { Spinner } from '@/components/ui/Primitives';

/**
 * Redirects to /login (preserving the intended destination) if unauthenticated,
 * or to / if the user's role isn't in `allowedRoles`. Renders a spinner while
 * auth state is hydrating so protected pages never flash unauthenticated content.
 */
export function useRequireAuth(allowedRoles?: Role[]) {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isHydrated]);

  const isReady = isHydrated && !!user && (!allowedRoles || allowedRoles.includes(user.role));
  return { user, isReady, isHydrated };
}

export function AuthGate({
  allowedRoles,
  children,
}: {
  allowedRoles?: Role[];
  children: React.ReactNode;
}) {
  const { isReady } = useRequireAuth(allowedRoles);

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
