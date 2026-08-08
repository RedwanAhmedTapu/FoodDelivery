'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/endpoints/misc';
import { Card, Spinner } from '@/components/ui/Primitives';
import { formatCurrency } from '@/lib/utils';

interface ShopOwnerDashboard {
  totalStores: number;
  activeStores: number;
  totalOrders: number;
  todaysOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSales: number;
  lowStockFoods: { _id: string; name: string; stock: number }[];
}

export default function ShopOwnerOverviewPage() {
  const [data, setData] = useState<ShopOwnerDashboard | null>(null);

  useEffect(() => {
    adminApi.shopOwnerDashboard().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const stats = [
    { label: 'Active stores', value: `${data.activeStores}/${data.totalStores}` },
    { label: "Today's orders", value: data.todaysOrders },
    { label: 'Pending orders', value: data.pendingOrders },
    { label: 'Total sales', value: formatCurrency(data.totalSales) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-paper">{s.value}</p>
          </Card>
        ))}
      </div>

      {data.lowStockFoods.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-medium text-paper">Low stock items</h2>
          <div className="space-y-2">
            {data.lowStockFoods.map((f) => (
              <div key={f._id} className="flex justify-between text-sm">
                <span className="text-muted">{f.name}</span>
                <span className="font-mono text-chili">{f.stock} left</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
