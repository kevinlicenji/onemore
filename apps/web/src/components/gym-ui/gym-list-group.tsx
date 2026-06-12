'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface GymListGroupProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/**
 * iOS-style inset grouped list container for mobile screens.
 */
export function GymListGroup({ children, className, title }: GymListGroupProps): ReactElement {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title ? (
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <ul className="overflow-hidden rounded-2xl border border-gym-separator bg-gym-surface shadow-sm">
        {children}
      </ul>
    </section>
  );
}
