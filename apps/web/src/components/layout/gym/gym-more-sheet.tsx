'use client';

import { cn } from '@onemore/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { GymSheet } from '@/components/gym-ui/gym-sheet';
import { triggerHaptic } from '@/lib/haptic';
import type { GymMoreNavItem } from '@/lib/nav-items';

interface GymMoreSheetProps {
  open: boolean;
  route: string;
  items: GymMoreNavItem[];
  onClose: () => void;
}

/**
 * Thumb-friendly sheet for secondary gym destinations (exercises, settings).
 */
export function GymMoreSheet({
  open,
  route,
  items,
  onClose,
}: GymMoreSheetProps): React.ReactElement {
  const t = useTranslations('Nav');

  return (
    <GymSheet
      ariaLabel={t('moreMenuTitle')}
      open={open}
      title={t('moreMenuTitle')}
      onClose={onClose}
    >
      <ul className="flex flex-col overflow-hidden rounded-2xl border border-gym-separator bg-gym-surface">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = item.match(route);
          return (
            <li key={item.href} className={cn(index > 0 && 'border-t border-gym-separator')}>
              <Link
                href={item.href}
                className={cn(
                  'flex min-h-14 items-center gap-4 px-4 py-3 text-base font-medium transition-colors active:bg-muted/60',
                  active ? 'bg-primary/8 text-primary' : 'text-foreground',
                )}
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
              >
                <Icon aria-hidden className="h-6 w-6 shrink-0" />
                <span className="flex-1">{t(item.labelKey)}</span>
                <ChevronRight aria-hidden className="h-5 w-5 text-muted-foreground/60" />
              </Link>
            </li>
          );
        })}
      </ul>
    </GymSheet>
  );
}
