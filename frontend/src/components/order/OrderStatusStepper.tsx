import { Check, X } from 'lucide-react';
import {
  cn,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
} from '@/lib/utils';
import { OrderStatus } from '@/types';

export function OrderStatusStepper({
  status,
}: {
  status: OrderStatus;
}) {
  // Cancelled / Rejected
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-chili/30 bg-chili-soft px-4 py-3">
        <X className="h-5 w-5 text-chili" />

        <span className="font-semibold text-chili">
          Order{' '}
          {status === 'CANCELLED'
            ? 'cancelled'
            : 'rejected'}
        </span>
      </div>
    );
  }

  const currentIndex =
    ORDER_STATUS_FLOW.indexOf(status);

  const isDelivered = status === 'DELIVERED';

  return (
    <div className="relative pl-2">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast =
          i === ORDER_STATUS_FLOW.length - 1;

        // Special styling for the final DELIVERED state
        const isDeliveredCurrent =
          isDelivered && step === 'DELIVERED';

        return (
          <div
            key={step}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'route-line absolute left-[11px] top-6 h-full',

                  (isDone || isCurrent) &&
                    'opacity-100',

                  !isDone &&
                    !isCurrent &&
                    'opacity-30'
                )}
              />
            )}

            {/* Status circle */}
            <div
              className={cn(
                'z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',

                // Completed steps
                isDone &&
                  'border-mango bg-mango text-base',

                // Normal current step
                isCurrent &&
                  !isDeliveredCurrent &&
                  'border-mango bg-base text-mango animate-pulse',

                // DELIVERED current step
                isDeliveredCurrent &&
                  'border-mango bg-mango text-base shadow-[0_0_12px_rgba(245,158,11,0.35)]',

                // Upcoming steps
                !isDone &&
                  !isCurrent &&
                  'border-border bg-surface text-faint'
              )}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" />
              ) : isDeliveredCurrent ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </div>

            {/* Status label */}
            <span
              className={cn(
                'pt-0.5 text-sm',

                // DELIVERED → yellow + bold
                isDeliveredCurrent &&
                  'font-bold text-mango',

                // Other current statuses
                isCurrent &&
                  !isDeliveredCurrent &&
                  'font-semibold text-paper',

                // Completed previous statuses
                isDone &&
                  !isDeliveredCurrent &&
                  'text-muted',

                // Upcoming
                !isDone &&
                  !isCurrent &&
                  'text-faint'
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