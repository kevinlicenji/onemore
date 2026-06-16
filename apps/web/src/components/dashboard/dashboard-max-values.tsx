'use client';

import type { UserExerciseMaxWithExercise } from '@onemore/shared';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { getExerciseDisplayName } from '@/lib/exercise-display-name';

interface DashboardMaxValuesProps {
  maxValues: UserExerciseMaxWithExercise[];
  pendingCount: number;
  locale: string;
  mobile?: boolean;
}

/**
 * Dashboard card summarizing official 1RM max values.
 */
export function DashboardMaxValues({
  maxValues,
  pendingCount,
  locale,
  mobile = false,
}: DashboardMaxValuesProps): ReactElement {
  const t = useTranslations('MaxValues');

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <Dumbbell aria-hidden className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-muted-foreground">{t('dashboardTitle')}</p>
        </div>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {t('pendingBadge', { count: pendingCount })}
          </span>
        ) : null}
      </div>

      {maxValues.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {maxValues.slice(0, 4).map((max) => (
            <div
              key={max.id}
              className="flex items-center justify-between rounded-lg border border-gym-separator bg-background px-3 py-2"
            >
              <p className="truncate text-sm font-medium">
                {getExerciseDisplayName({ names: max.exercise.names }, locale)}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{max.weight} kg</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-gym-separator px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">{t('emptyActive')}</p>
        </div>
      )}

      <Link
        className="mt-3 block text-center text-xs font-medium text-primary"
        href={`/${locale}/max-values`}
      >
        {t('title')} →
      </Link>
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
    <div className="rounded-lg border border-gym-separator bg-card p-5 shadow-sm">{content}</div>
  );
}
