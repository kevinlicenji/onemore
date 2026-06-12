'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface GymEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Illustrated empty state for mobile list screens.
 */
export function GymEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: GymEmptyStateProps): ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-gym-separator bg-gym-tint/40 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-4 w-full text-pretty text-base font-semibold">{title}</p>
      {description ? (
        <p className="mt-2 w-full text-pretty text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 w-full">{action}</div> : null}
    </div>
  );
}
