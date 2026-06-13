'use client';

import type { DifficultyLevel } from '@onemore/shared';
import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { DifficultyStepsIcon } from '@/components/difficulty-steps-icon';

interface DifficultyLevelPickerProps {
  value: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
  className?: string;
}

const LEVELS: DifficultyLevel[] = [1, 2, 3];

/**
 * Manual difficulty override control for program builder days.
 */
export function DifficultyLevelPicker({
  value,
  onChange,
  className,
}: DifficultyLevelPickerProps): ReactElement {
  const t = useTranslations('Programs');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-sm font-medium">{t('difficultyLabel')}</span>
      <div className="flex gap-2">
        {LEVELS.map((level) => (
          <button
            key={level}
            aria-label={t(`difficultyLevel${String(level)}`)}
            aria-pressed={value === level}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center rounded-lg border px-3 py-2 transition-colors',
              value === level
                ? 'border-primary bg-primary/8'
                : 'border-gym-separator bg-background active:bg-muted/40',
            )}
            type="button"
            onClick={() => {
              onChange(level);
            }}
          >
            <DifficultyStepsIcon level={level} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}
