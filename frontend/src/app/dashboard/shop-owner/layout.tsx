'use client';

import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Wallet,
  UserCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { AuthGate } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { getSocket } from '@/lib/socket';

export default function ShopOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handleNewOrder = () => {
      setNewOrderCount((prev) => prev + 1);
    };

    socket.on('order:new', handleNewOrder);

    return () => {
      socket.off('order:new', handleNewOrder);
    };
  }, []);

  const navItems = [
    {
      href: '/dashboard/shop-owner',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/shop-owner/stores',
      label: 'My stores',
      icon: Store,
    },
    {
      href: '/dashboard/shop-owner/foods',
      label: 'Menu',
      icon: UtensilsCrossed,
    },
    {
      href: '/dashboard/shop-owner/orders',
      label: 'Orders',
      icon: Receipt,
      badge: newOrderCount,
      onClick: () => setNewOrderCount(0),
    },
    {
      href: '/dashboard/shop-owner/wallet',
      label: 'Wallet',
      icon: Wallet,
    },
    {
      href: '/dashboard/shop-owner/subscription',
      label: 'Subscription',
      icon: CreditCard,
    },
    {
      href: '/dashboard/shop-owner/profile',
      label: 'Profile',
      icon: UserCircle,
    },
  ];

  return (
    <AuthGate allowedRoles={['SHOP_OWNER']}>
      <DashboardShell
        title="Shop owner"
        subtitle="Manage your business"
        navItems={navItems}
      >
        {children}
      </DashboardShell>
    </AuthGate>
  );
}