'use client';

import { LayoutDashboard, Store, Users, Bike, Tags, Settings, Truck, Wallet, HandCoins, Banknote } from 'lucide-react';
import { AuthGate } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';

const navItems = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/stores', label: 'Store approvals', icon: Store },
  { href: '/dashboard/admin/shop-owners', label: 'Shop owners', icon: Users },
  { href: '/dashboard/admin/delivery-boys', label: 'Delivery boys', icon: Bike },
  { href: '/dashboard/admin/delivery-boys-assign', label: 'Assign deliveries', icon: Truck },
  { href: '/dashboard/admin/payouts', label: 'Payouts', icon: HandCoins },
  { href: '/dashboard/admin/cod-remittances', label: 'COD remittances', icon: Banknote },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions & pricing', icon: Wallet },
  { href: '/dashboard/admin/categories', label: 'Categories', icon: Tags },
  { href: '/dashboard/admin/settings', label: 'Platform settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allowedRoles={['SUPER_ADMIN']}>
      <DashboardShell title="Admin" subtitle="Platform control center" navItems={navItems}>
        {children}
      </DashboardShell>
    </AuthGate>
  );
}
