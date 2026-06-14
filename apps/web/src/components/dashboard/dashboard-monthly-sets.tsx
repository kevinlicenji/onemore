'use client';

import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { GymStatTile } from '@/components/gym-ui/gym-stat-tile';

interface DashboardMonthlySetsProps {
  count: number;
  mobile?: boolean;
}

/**
 * KPI — Working sets completed in the current calendar month.
 */
export function DashboardMonthlySets({
  count,
  mobile = false,
}: DashboardMonthlySetsProps): ReactElement {
  const t = useTranslations('Dashboard');

  if (mobile) {
    return <GymStatTile label={t('monthlySetsLabel')} unit={t('monthlySetsUnit')} value={count} />;
  }

  return (
    <div className="flex flex-col justify-between rounded-lg border bg-card p-6">
      <div className="flex items-start gap-3">
        <Layers aria-hidden className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">{t('monthlySetsLabel')}</p>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">{count}</p>
      <p className="text-sm text-muted-foreground">{t('monthlySetsUnit')}</p>
    </div>
  );
}
