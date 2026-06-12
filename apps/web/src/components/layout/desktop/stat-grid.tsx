import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface StatGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive stat card grid for dashboard and analytics views.
 */
export function StatGrid({ children, className }: StatGridProps): ReactElement {
  return (
    <div className={cn('grid grid-cols-2 gap-4 xl:grid-cols-4', className)}>{children}</div>
  );
}
