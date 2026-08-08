import { Check, X } from 'lucide-react';
import { cn, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from '@/lib/utils';
import { OrderStatus } from '@/types';

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-chili/30 bg-chili-soft px-4 py-3">
        <X className="h-5 w-5 text-chili" />
        <span className="font-medium text-chili">
          Order {status === 'CANCELLED' ? 'cancelled' : 'rejected'}
        </span>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <div className="relative pl-2">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === ORDER_STATUS_FLOW.length - 1;

        return (
          <div key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'route-line absolute left-[11px] top-6 h-full',
                  (isDone || isCurrent) && 'opacity-100',
                  !isDone && !isCurrent && 'opacity-30'
                )}
              />
            )}
            <div
              className={cn(
                'z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                isDone && 'border-mango bg-mango text-base',
                isCurrent && 'border-mango bg-base text-mango animate-pulse',
                !isDone && !isCurrent && 'border-border bg-surface text-faint'
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'pt-0.5 text-sm',
                isCurrent && 'font-semibold text-paper',
                isDone && 'text-muted',
                !isDone && !isCurrent && 'text-faint'
              )}
            >
              {ORDER_STATUS_LABEL[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
