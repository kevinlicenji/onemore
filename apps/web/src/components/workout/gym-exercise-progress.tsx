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
}

function isExerciseDone(
  index: number,
  completedIndexes: number[],
  skippedIndexes: number[],
): boolean {
  return completedIndexes.includes(index) || skippedIndexes.includes(index);
}

/**
 * Equidistant exercise progress dots for the active workout header.
 */
export function GymExerciseProgress({
  total,
  currentIndex,
  completedIndexes,
  skippedIndexes,
  className,
}: GymExerciseProgressProps): ReactElement {
  if (total <= 0) {
    return <div className={className} />;
  }

  return (
    <div
      aria-hidden
      className={cn('mt-3 flex w-full items-center justify-between gap-1', className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const done = isExerciseDone(index, completedIndexes, skippedIndexes);
        const current = index === currentIndex;

        if (done) {
          return (
            <span key={index} className="flex h-5 w-5 shrink-0 items-center justify-center">
              <GymCompletedCheck className="h-5 w-5" />
            </span>
          );
        }

        return (
          <span
            key={index}
            className={cn(
              'h-2.5 shrink-0 rounded-full transition-all',
              current ? 'w-2.5 bg-primary ring-4 ring-primary/20' : 'w-2.5 bg-muted-foreground/30',
            )}
          />
        );
      })}
    </div>
  );
}
