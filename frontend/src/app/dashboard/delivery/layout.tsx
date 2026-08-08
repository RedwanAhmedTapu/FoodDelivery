'use client';

import { Bike, Wallet, UserCircle } from 'lucide-react';
import { AuthGate } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DispatchOfferModal } from '@/components/delivery/DispatchOfferModal';

const navItems = [
  { href: '/dashboard/delivery', label: 'My deliveries', icon: Bike },
  { href: '/dashboard/delivery/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/delivery/profile', label: 'Profile', icon: UserCircle },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allowedRoles={['DELIVERY_BOY']}>
      <DashboardShell title="Delivery" subtitle="Manage your deliveries" navItems={navItems}>
        {children}
      </DashboardShell>
      <DispatchOfferModal />
    </AuthGate>
  );
}
