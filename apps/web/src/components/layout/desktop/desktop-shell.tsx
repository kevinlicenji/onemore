'use client';

import { usePathname } from 'next/navigation';

import { shouldHideShell } from '@/lib/shell-routes';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

interface DesktopShellProps {
  locale: string;
  children: React.ReactNode;
}

/**
 * Desktop app chrome: sidebar + header + scrollable content area.
 */
export function DesktopShell({ locale, children }: DesktopShellProps): React.ReactElement {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const route = segments.slice(1).join('/');
  const hideShell = shouldHideShell(route);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar locale={locale} />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <AppHeader locale={locale} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
