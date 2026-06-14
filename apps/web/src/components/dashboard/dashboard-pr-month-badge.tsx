'use client';

import { cn } from '@onemore/ui';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { GymStatTile } from '@/components/gym-ui/gym-stat-tile';

interface DashboardPrMonthBadgeProps {
  count: number;
  mobile?: boolean;
}

/**
 * KPI — Personal records earned in the current calendar month.
 */
export function DashboardPrMonthBadge({
  count,
  mobile = false,
}: DashboardPrMonthBadgeProps): ReactElement {
  const t = useTranslations('Dashboard');

  if (mobile) {
    return (
      <GymStatTile
        className="border-amber-500/20 bg-amber-500/[0.06]"
        label={t('monthlyPrLabel')}
        unit={t('monthlyPrUnit')}
        value={count}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-6',
      )}
    >
      <div className="flex items-start gap-3">
        <Trophy aria-hidden className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-muted-foreground">{t('monthlyPrLabel')}</p>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">{count}</p>
      <p className="text-sm text-muted-foreground">{t('monthlyPrUnit')}</p>
    </div>
  );
}
