'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { cn } from '@onemore/ui';
import { Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

interface DashboardWeekTrackerProps {
  consistency: AnalyticsDashboard['weeklyConsistency'];
  streakWeeks: number;
  className?: string;
}

/**
 * KPI 1 — Costanza: weekly streak flame + Mon–Sun completion strip.
 */
export function DashboardWeekTracker({
  consistency,
  streakWeeks,
  className,
}: DashboardWeekTrackerProps): ReactElement {
  const t = useTranslations('Dashboard');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gym-separator bg-gradient-to-br from-primary/12 via-gym-surface to-gym-tint p-5 shadow-sm',
        className,
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{t('consistencyTitle')}</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Flame aria-hidden className="h-6 w-6" />
          </span>
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight">{streakWeeks}</p>
            <p className="text-sm text-muted-foreground">{t('streakUnit')}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:max-w-xs sm:items-end">
          <div className="flex w-full items-center justify-between gap-1 sm:justify-end">
            {consistency.weekDays.map((day) => (
              <div key={day.weekday} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    day.completed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-gym-separator bg-background text-muted-foreground',
                    day.isToday && !day.completed && 'ring-2 ring-primary/40',
                  )}
                  aria-label={day.completed ? t('dayCompleted', { day: day.label }) : day.label}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium tabular-nums text-foreground">
            {t('weeklyTargetProgress', {
              completed: consistency.workoutsCompleted,
              target: consistency.weeklyTarget,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
