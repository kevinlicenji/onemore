'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { buildMobileNavItems } from '@/lib/nav-items';
import { shouldHideShell } from '@/lib/shell-routes';

interface AppShellProps {
  locale: string;
  children: React.ReactNode;
}

/**
 * Legacy mobile app chrome with persistent bottom navigation.
 */
export function AppShell({ locale, children }: AppShellProps): React.ReactElement {
  const pathname = usePathname();
  const t = useTranslations('Nav');

  const segments = pathname.split('/').filter(Boolean);
  const route = segments.slice(1).join('/');
  const hideShell = shouldHideShell(route);
  const navItems = buildMobileNavItems(locale);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-20">{children}</div>
      <nav
        aria-label={t('ariaLabel')}
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active = item.match(route);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 flex-col items-center justify-center rounded-md px-1 text-center text-[11px] font-medium leading-tight transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
