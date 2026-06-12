'use client';

import { cn } from '@onemore/ui';
import { usePathname } from 'next/navigation';

import { useActiveWorkoutSession } from '@/hooks/use-active-workout-session';
import { shouldHideShell } from '@/lib/shell-routes';

import { GymActiveWorkoutBar } from './gym-active-workout-bar';
import { GymBottomNav } from './gym-bottom-nav';

interface GymShellProps {
  locale: string;
  children: React.ReactNode;
}

/**
 * Mobile gym chrome: thumb-zone nav with prominent workout CTA.
 */
export function GymShell({ locale, children }: GymShellProps): React.ReactElement {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const route = segments.slice(1).join('/');
  const hideShell = shouldHideShell(route);
  const { session: activeSession } = useActiveWorkoutSession();
  const showResumeBar = activeSession !== null && !route.startsWith('workouts/');

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={cn(
          'min-h-screen bg-background dark:bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--gym-tint)/0.35)_100%)]',
          showResumeBar
            ? 'pb-[calc(var(--tab-bar-height)+3.25rem+env(safe-area-inset-bottom))]'
            : 'pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]',
        )}
      >
        {children}
      </div>
      <GymActiveWorkoutBar route={route} />
      <GymBottomNav locale={locale} route={route} />
    </>
  );
}
