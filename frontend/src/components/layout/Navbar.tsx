'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingBag, User as UserIcon, LogOut, LayoutDashboard, Bike, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/layout/NotificationBell';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { cart, refresh } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user?.role === 'CUSTOMER') refresh();
  }, [user, refresh]);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const dashboardPath =
    user?.role === 'SUPER_ADMIN'
      ? '/dashboard/admin'
      : user?.role === 'SHOP_OWNER'
      ? '/dashboard/shop-owner'
      : user?.role === 'DELIVERY_BOY'
      ? '/dashboard/delivery'
      : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-base/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-paper">
            Rickshaw<span className="text-mango">Bites</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/stores" className="hover:text-paper">
            Browse stores
          </Link>
          {user?.role === 'CUSTOMER' && (
            <Link href="/orders" className="hover:text-paper">
              My orders
            </Link>
          )}
          {user?.role === 'CUSTOMER' && (
            <Link href="/points" className="hover:text-paper">
              Points
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user?.role === 'CUSTOMER' && (
            <Link
              href="/cart"
              className="relative rounded-lg border border-border p-2.5 hover:border-mango"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5 text-paper" />
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-chili text-[10px] font-bold text-paper">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {user && <NotificationBell />}

          {dashboardPath && !pathname.startsWith('/dashboard') && (
            <Link href={dashboardPath}>
              <Button size="sm" variant="outline">
                {user?.role === 'SUPER_ADMIN' && <ShieldCheck className="h-4 w-4" />}
                {user?.role === 'SHOP_OWNER' && <LayoutDashboard className="h-4 w-4" />}
                {user?.role === 'DELIVERY_BOY' && <Bike className="h-4 w-4" />}
                Dashboard
              </Button>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:border-mango hover:text-paper sm:flex"
              >
                <UserIcon className="h-4 w-4" />
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="rounded-lg border border-border p-2.5 text-muted hover:border-chili hover:text-chili"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
