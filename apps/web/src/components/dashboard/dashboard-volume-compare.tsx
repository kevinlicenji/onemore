'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { Card, CardContent, cn } from '@onemore/ui';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

interface DashboardVolumeCompareProps {
  volume: AnalyticsDashboard['volumeComparison'];
  mobile?: boolean;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k`;
  }
  return String(Math.round(kg));
}

/**
 * KPI — Volume comparison: last week vs current week with progress bar.
 */
export function DashboardVolumeCompare({
  volume,
  mobile = false,
}: DashboardVolumeCompareProps): ReactElement {
  const t = useTranslations('Dashboard');

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t('volumeCompareTitle')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{formatVolume(volume.thisWeekKg)}</p>
          <p className="text-xs text-muted-foreground">{t('volumeThisWeek')}</p>
        </div>
        {!mobile ? <TrendingUp aria-hidden className="h-5 w-5 text-primary" /> : null}
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('volumeLastWeek', { kg: formatVolume(volume.lastWeekKg) })}</span>
          <span>{t('volumeProgress', { percent: volume.progressToMatchLastWeek })}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${String(volume.progressToMatchLastWeek)}%` }}
          />
        </div>
      </div>
    </>
  );

  if (mobile) {
    return (
      <div className="rounded-2xl border border-gym-separator bg-gym-surface p-4 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className={cn('p-6')}>{content}</CardContent>
    </Card>
  );
}
