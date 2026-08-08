'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: 'alert' | number;
}

export function DashboardShell({
  title,
  subtitle,
  navItems,
  children,
}: {
  title: string;
  subtitle?: string;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl">
      {/* Fixed sidebar — stays put while dashboard content scrolls */}
      <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 flex-col border-r border-border bg-surface/60 py-6 md:flex">
        <div className="px-5 pb-5">
          <p className="font-display text-lg text-paper">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-mango text-base font-medium shadow-ticket'
                    : 'text-muted hover:bg-card hover:text-paper'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={cn('h-4 w-4', active ? 'text-base' : 'text-faint group-hover:text-mango')} />
                  {item.label}
                </span>
                {item.badge === 'alert' && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-chili" aria-label="Needs attention" />
                )}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                      active ? 'bg-base/20 text-base' : 'bg-chili text-paper'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: horizontal scroll nav instead of a sidebar */}
      <div className="w-full md:hidden">
        <div className="border-b border-border bg-surface/60 px-4 py-4">
          <p className="font-display text-xl text-paper">{title}</p>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs',
                    active ? 'border-mango bg-mango-soft text-mango' : 'border-border text-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  {item.badge === 'alert' && <span className="h-1.5 w-1.5 rounded-full bg-chili" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-4 py-6">{children}</div>
      </div>

      {/* Desktop content */}
      <div className="hidden min-w-0 flex-1 px-6 py-8 md:block lg:px-10">{children}</div>
    </div>
  );
}
