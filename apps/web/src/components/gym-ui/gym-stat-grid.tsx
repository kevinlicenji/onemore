'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface GymStatGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Two-column stat layout tuned for thumb reach on iPhone.
 */
export function GymStatGrid({ children, className }: GymStatGridProps): ReactElement {
  return <div className={cn('grid grid-cols-2 gap-3', className)}>{children}</div>;
}
