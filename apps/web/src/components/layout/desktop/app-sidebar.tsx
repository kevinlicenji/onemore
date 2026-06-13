'use client';

import { cn } from '@onemore/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppLogo } from '@/components/app-logo';
import { buildNavItems } from '@/lib/nav-items';

interface AppSidebarProps {
  locale: string;
}

/**
 * Fixed left sidebar navigation for desktop layout.
 */
export function AppSidebar({ locale }: AppSidebarProps): React.ReactElement {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const segments = pathname.split('/').filter(Boolean);
  const route = segments.slice(1).join('/');
  const navItems = buildNavItems(locale);

  return (
    <aside className="flex h-full w-sidebar shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6">
        <Link href={`/${locale}/dashboard`} className="text-foreground">
          <AppLogo showWordmark size={36} />
        </Link>
      </div>
      <nav aria-label={t('ariaLabel')} className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active = item.match(route);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'border-l-2 border-primary bg-primary/10 pl-[calc(0.75rem-2px)] text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
