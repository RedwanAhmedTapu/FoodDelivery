'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/endpoints/misc';
import { Card, Spinner } from '@/components/ui/Primitives';
import { formatCurrency } from '@/lib/utils';

interface AdminDashboard {
  totalUsers: number;
  totalShopOwners: number;
  totalStores: number;
  activeStores: number;
  totalDeliveryBoys: number;
  activeDeliveryBoys: number;
  totalOrders: number;
  todaysOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingReports: number;
  revenue: number;
  platformFeesCollected: number;
  pointsIssued: number;
  pointsRedeemed: number;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    adminApi.dashboard().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const stats = [
    { label: 'Total customers', value: data.totalUsers },
    { label: 'Shop owners', value: data.totalShopOwners },
    { label: 'Active stores', value: `${data.activeStores}/${data.totalStores}` },
    { label: 'Online riders', value: `${data.activeDeliveryBoys}/${data.totalDeliveryBoys}` },
    { label: "Today's orders", value: data.todaysOrders },
    { label: 'Completed orders', value: data.completedOrders },
    { label: 'Cancelled orders', value: data.cancelledOrders },
    { label: 'Pending reports', value: data.pendingReports },
    { label: 'Total revenue', value: formatCurrency(data.revenue) },
    { label: 'Platform fees collected', value: formatCurrency(data.platformFeesCollected) },
    { label: 'Points issued', value: data.pointsIssued },
    { label: 'Points redeemed', value: data.pointsRedeemed },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <p className="text-xs text-muted">{s.label}</p>
          <p className="mt-1 font-display text-2xl text-paper">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}
