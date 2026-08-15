'use client';

import {
  LayoutDashboard,
  Store,
  Users,
  Bike,
  Tags,
  Settings,
  Truck,
  Wallet,
  HandCoins,
  Banknote,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { AuthGate } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { getSocket } from '@/lib/socket';

export default function AdminLayout({
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
      href: '/dashboard/admin',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/admin/stores',
      label: 'Store approvals',
      icon: Store,
    },
    {
      href: '/dashboard/admin/shop-owners',
      label: 'Shop owners',
      icon: Users,
    },
    {
      href: '/dashboard/admin/delivery-boys',
      label: 'Delivery boys',
      icon: Bike,
    },
    {
      href: '/dashboard/admin/delivery-boys-assign',
      label: 'Assign deliveries',
      icon: Truck,

      // New orders waiting for delivery assignment
      badge: newOrderCount,

      // Clear notification when admin opens Assign deliveries
      onClick: () => setNewOrderCount(0),
    },
    {
      href: '/dashboard/admin/payouts',
      label: 'Payouts',
      icon: HandCoins,
    },
    {
      href: '/dashboard/admin/cod-remittances',
      label: 'COD remittances',
      icon: Banknote,
    },
    {
      href: '/dashboard/admin/subscriptions',
      label: 'Subscriptions & pricing',
      icon: Wallet,
    },
    {
      href: '/dashboard/admin/categories',
      label: 'Categories',
      icon: Tags,
    },
    {
      href: '/dashboard/admin/settings',
      label: 'Platform settings',
      icon: Settings,
    },
  ];

  return (
    <AuthGate allowedRoles={['SUPER_ADMIN']}>
      <DashboardShell
        title="Admin"
        subtitle="Platform control center"
        navItems={navItems}
      >
        {children}
      </DashboardShell>
    </AuthGate>
  );
}