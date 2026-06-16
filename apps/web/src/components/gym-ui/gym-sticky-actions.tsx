'use client';

import { cn } from '@onemore/ui';
import { usePathname } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';

import { useActiveWorkoutSession } from '@/hooks/use-active-workout-session';
import { gymMobileStackedActionsClassName } from '@/lib/gym-mobile-layout';

interface GymStickyActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fixed primary actions above the bottom tab bar (and optional resume strip).
 */
export function GymStickyActions({ children, className }: GymStickyActionsProps): ReactElement {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const route = segments.slice(1).join('/');
  const { session: activeSession } = useActiveWorkoutSession();
  const showResumeBar = activeSession !== null && !route.startsWith('workouts/');

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 border-t border-gym-separator bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85',
        gymMobileStackedActionsClassName,
        showResumeBar
          ? 'bottom-[calc(var(--tab-bar-height)+3.25rem+env(safe-area-inset-bottom))]'
          : 'bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Scroll spacer so page content is not hidden behind GymStickyActions.
 */
export function GymStickyActionsSpacer(): ReactElement {
  return <div aria-hidden className="h-28 shrink-0" />;
}
