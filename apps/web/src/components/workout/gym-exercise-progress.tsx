'use client';

import { cn } from '@onemore/ui';
import type { ReactElement } from 'react';

import { GymCompletedCheck } from '@/components/gym-ui/gym-completed-check';

interface GymExerciseProgressProps {
  total: number;
  currentIndex: number;
  completedIndexes: number[];
  skippedIndexes: number[];
  className?: string;
  onSelectIndex?: (index: number) => void;
}

function isExerciseDone(
  index: number,
  completedIndexes: number[],
  skippedIndexes: number[],
): boolean {
  return completedIndexes.includes(index) || skippedIndexes.includes(index);
}

/**
 * Connected exercise progress track for the active workout header.
 */
export function GymExerciseProgress({
  total,
  currentIndex,
  completedIndexes,
  skippedIndexes,
  className,
  onSelectIndex,
}: GymExerciseProgressProps): ReactElement {
  if (total <= 0) {
    return <div className={className} />;
  }

  return (
    <div
      aria-label="Exercise progress"
      className={cn('relative mt-3 w-full', className)}
      role="tablist"
    >
      {total > 1 ? (
        <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-foreground/25" />
      ) : null}
      <div className="relative flex w-full items-center justify-between">
        {Array.from({ length: total }, (_, index) => {
          const done = isExerciseDone(index, completedIndexes, skippedIndexes);
          const current = index === currentIndex;

          if (done) {
            return (
              <button
                key={index}
                aria-label={`Exercise ${String(index + 1)} completed`}
                aria-selected={current}
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-foreground/30"
                role="tab"
                type="button"
                onClick={() => {
                  onSelectIndex?.(index);
                }}
              >
                <GymCompletedCheck className="h-4 w-4 text-foreground" />
              </button>
            );
          }

          return (
            <button
              key={index}
              aria-label={`Exercise ${String(index + 1)}`}
              aria-selected={current}
              className={cn(
                'relative z-10 h-8 w-8 shrink-0 rounded-full border-2 bg-background transition-transform active:scale-95',
                current
                  ? 'border-primary bg-primary ring-4 ring-primary/25'
                  : 'border-foreground/35',
              )}
              role="tab"
              type="button"
              onClick={() => {
                onSelectIndex?.(index);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
