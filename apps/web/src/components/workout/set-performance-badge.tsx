'use client';

import type { PerformanceFeedbackTier } from '@onemore/shared';
import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import type { SetPerformanceFeedback } from '@/lib/performance-feedback';

interface SetPerformanceBadgeProps {
  feedback: SetPerformanceFeedback;
  className?: string;
}

const tierStyles: Record<PerformanceFeedbackTier, string> = {
  superior: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  on_target: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
  fatigue: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
};

/**
 * Micro-badge shown beside a completed set with instant performance feedback.
 */
export function SetPerformanceBadge({
  feedback,
  className,
}: SetPerformanceBadgeProps): ReactElement {
  const t = useTranslations('Workouts');

  const labelKey =
    feedback.tier === 'superior'
      ? 'perfBadgeSuperior'
      : feedback.tier === 'fatigue'
        ? 'perfBadgeFatigue'
        : 'perfBadgeOnTarget';

  const tooltipKey =
    feedback.tier === 'superior'
      ? 'perfTooltipSuperior'
      : feedback.tier === 'fatigue'
        ? 'perfTooltipFatigue'
        : 'perfTooltipOnTarget';

  const shortLabel =
    feedback.tier === 'superior'
      ? t('perfBadgeSuperiorShort', { delta: feedback.deltaPercent })
      : t(labelKey);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
        tierStyles[feedback.tier],
        className,
      )}
      title={t(tooltipKey)}
    >
      {shortLabel}
    </span>
  );
}
