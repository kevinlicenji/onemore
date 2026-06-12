'use client';

import { usePathname } from 'next/navigation';

import { shouldHideShell } from '@/lib/shell-routes';

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

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <GymBottomNav locale={locale} route={route} />
    </>
  );
}
