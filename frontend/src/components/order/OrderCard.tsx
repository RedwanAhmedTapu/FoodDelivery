import Link from 'next/link';
import { Order, Store } from '@/types';
import { Badge, Card } from '@/components/ui/Primitives';
import { formatCurrency, formatDate, ORDER_STATUS_LABEL } from '@/lib/utils';

const statusVariant: Record<string, 'neutral' | 'mango' | 'chili' | 'delivered'> = {
  DELIVERED: 'delivered',
  CANCELLED: 'chili',
  REJECTED: 'chili',
};

export function OrderCard({ order }: { order: Order }) {
  const store = typeof order.storeId === 'object' ? (order.storeId as Store) : null;

  return (
    <Link href={`/orders/${order._id}`}>
      <Card className="ticket-notch p-4 transition-colors hover:border-mango/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-faint">{order.orderNumber}</p>
            <p className="mt-0.5 font-medium text-paper">{store?.name || 'Store'}</p>
            <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
          </div>
          <Badge variant={statusVariant[order.orderStatus] || 'mango'}>
            {ORDER_STATUS_LABEL[order.orderStatus]}
          </Badge>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted">{order.items.length} item(s)</span>
          <span className="font-mono font-semibold text-paper">{formatCurrency(order.total)}</span>
        </div>
      </Card>
    </Link>
  );
}
