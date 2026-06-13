'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { buildNavItems } from '@/lib/nav-items';

interface AppHeaderProps {
  locale: string;
}

/**
 * Top header bar with current section title and global actions.
 */
export function AppHeader({ locale }: AppHeaderProps): React.ReactElement {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const segments = pathname.split('/').filter(Boolean);
  const route = segments.slice(1).join('/');
  const navItems = buildNavItems(locale);
  const activeItem = navItems.find((item) => item.match(route));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <p className="text-sm font-medium text-muted-foreground">
        {activeItem ? t(activeItem.labelKey) : 'OneMore'}
      </p>
    </header>
  );
}
