'use client';

import { cn } from '@onemore/ui';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { triggerHaptic } from '@/lib/haptic';
import {
  buildGymMoreNavItems,
  buildGymPrimaryNavItems,
  isGymMoreRouteActive,
} from '@/lib/nav-items';

import { GymMoreSheet } from './gym-more-sheet';

interface GymBottomNavProps {
  locale: string;
  route: string;
}

/**
 * Thumb-zone bottom navigation with a prominent center workout action.
 */
export function GymBottomNav({ locale, route }: GymBottomNavProps): React.ReactElement {
  const t = useTranslations('Nav');
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = buildGymPrimaryNavItems(locale);
  const moreItems = buildGymMoreNavItems(locale);
  const moreActive = isGymMoreRouteActive(route);

  const leftItems = primaryItems.slice(0, 2);
  const rightItems = primaryItems.slice(2).filter((item) => !item.prominent);
  const workoutItem = primaryItems.find((item) => item.prominent);
  const WorkoutIcon = workoutItem?.icon;

  function handleNavTap(): void {
    triggerHaptic('light');
  }

  return (
    <>
      <nav
        aria-label={t('ariaLabel')}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gym-separator bg-gym-surface/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-gym-surface/80 dark:shadow-[0_-10px_28px_rgba(0,0,0,0.45)]"
      >
        <div className="relative mx-auto grid h-16 max-w-lg grid-cols-5 items-end px-2">
          {leftItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(route);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-all active:scale-95',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                onClick={handleNavTap}
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                    active && 'bg-primary/12',
                  )}
                >
                  <Icon aria-hidden className="h-6 w-6" />
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}

          {workoutItem && WorkoutIcon ? (
            <div className="flex flex-col items-center justify-end pb-1">
              <Link
                href={workoutItem.href}
                className={cn(
                  'flex h-14 w-14 -translate-y-3 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.45)] transition-transform active:scale-95',
                  workoutItem.match(route) && 'ring-4 ring-primary/20',
                )}
                aria-label={t(workoutItem.labelKey)}
                onClick={handleNavTap}
              >
                <WorkoutIcon aria-hidden className="h-7 w-7" strokeWidth={2.25} />
              </Link>
            </div>
          ) : null}

          {rightItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(route);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-all active:scale-95',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                onClick={handleNavTap}
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                    active && 'bg-primary/12',
                  )}
                >
                  <Icon aria-hidden className="h-6 w-6" />
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}

          <button
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-all active:scale-95',
              moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground',
            )}
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMoreOpen((value) => !value);
            }}
          >
            <span
              className={cn(
                'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                (moreActive || moreOpen) && 'bg-primary/12',
              )}
            >
              <Menu aria-hidden className="h-6 w-6" />
            </span>
            <span>{t('navMore')}</span>
          </button>
        </div>
      </nav>

      <GymMoreSheet
        open={moreOpen}
        route={route}
        items={moreItems}
        onClose={() => {
          setMoreOpen(false);
        }}
      />
    </>
  );
}
