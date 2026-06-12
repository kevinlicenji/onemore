'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

import { gymMobileStackedActionsClassName } from '@/lib/gym-mobile-layout';

interface GymMobileActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Full-width stacked action group for mobile page footers and headers.
 */
export function GymMobileActions({ children, className }: GymMobileActionsProps): ReactElement {
  return <div className={cn(gymMobileStackedActionsClassName, className)}>{children}</div>;
}
