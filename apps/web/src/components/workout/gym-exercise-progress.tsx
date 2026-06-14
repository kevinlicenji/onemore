'use client';

import { cn } from '@onemore/ui';
import { motion } from 'motion/react';
import type { ReactElement } from 'react';

import { GymCompletedCheck } from '@/components/gym-ui/gym-completed-check';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

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
 * Connected exercise progress track for the active workout header.
 */
export function GymExerciseProgress({
  total,
  currentIndex,
  completedIndexes,
  skippedIndexes,
  className,
}: GymExerciseProgressProps): ReactElement {
  const reducedMotion = useReducedMotion();

  if (total <= 0) {
    return <div className={className} />;
  }

  return (
    <div aria-hidden className={cn('relative mt-3 w-full', className)}>
      {total > 1 ? (
        <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-foreground/25" />
      ) : null}
      <div className="relative flex w-full items-center justify-between">
        {Array.from({ length: total }, (_, index) => {
          const done = isExerciseDone(index, completedIndexes, skippedIndexes);
          const current = index === currentIndex;

          if (done) {
            return (
              <motion.span
                key={index}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-foreground/30"
                initial={reducedMotion ? undefined : { opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2, delay: reducedMotion ? 0 : index * 0.02 }}
              >
                <GymCompletedCheck className="h-4 w-4 text-foreground" />
              </motion.span>
            );
          }

          return (
            <motion.span
              key={index}
              animate={{ scale: current ? 1.2 : 1 }}
              className={cn(
                'relative z-10 h-3 w-3 shrink-0 rounded-full border-2 bg-background',
                current
                  ? 'border-primary bg-primary ring-4 ring-primary/25'
                  : 'border-foreground/35',
              )}
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.5 }}
              layout
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 28,
                delay: reducedMotion ? 0 : index * 0.02,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
