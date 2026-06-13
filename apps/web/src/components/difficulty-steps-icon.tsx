'use client';

import type { DifficultyLevel } from '@onemore/shared';
import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

interface DifficultyStepsIconProps {
  level: DifficultyLevel;
  className?: string;
  size?: 'sm' | 'md';
}

const STEP_COLORS: Record<DifficultyLevel, string[]> = {
  1: ['bg-emerald-500', 'bg-muted-foreground/20', 'bg-muted-foreground/20'],
  2: ['bg-orange-500', 'bg-orange-500', 'bg-muted-foreground/20'],
  3: ['bg-red-500', 'bg-red-500', 'bg-red-500'],
};

const STEP_HEIGHTS = ['h-2', 'h-3.5', 'h-5'] as const;

/**
 * Three ascending steps indicating workout difficulty (1 easy → 3 hard).
 */
export function DifficultyStepsIcon({
  level,
  className,
  size = 'md',
}: DifficultyStepsIconProps): ReactElement {
  const t = useTranslations('Programs');
  const barWidth = size === 'sm' ? 'w-2' : 'w-2.5';

  return (
    <span
      aria-label={t(`difficultyLevel${String(level)}`)}
      className={cn('inline-flex items-end gap-0.5', className)}
      role="img"
    >
      {STEP_HEIGHTS.map((heightClass, index) => (
        <span
          key={heightClass}
          aria-hidden
          className={cn('rounded-sm', barWidth, heightClass, STEP_COLORS[level][index])}
        />
      ))}
    </span>
  );
}
