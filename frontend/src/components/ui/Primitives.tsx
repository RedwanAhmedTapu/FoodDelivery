import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card shadow-ticket', className)}
      {...props}
    />
  );
}

const badgeVariants: Record<string, string> = {
  neutral: 'bg-surface text-muted border-border',
  mango: 'bg-mango-soft text-mango border-mango/30',
  chili: 'bg-chili-soft text-chili border-chili/30',
  delivered: 'bg-delivered/10 text-delivered border-delivered/30',
};

export function Badge({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: keyof typeof badgeVariants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-mango', className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-faint" />}
      <p className="font-display text-lg text-paper">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
