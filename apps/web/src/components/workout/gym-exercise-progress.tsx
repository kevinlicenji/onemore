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
 * Equidistant exercise progress dots for the active workout header.
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
    <div
      aria-hidden
      className={cn('mt-3 flex w-full items-center justify-between gap-1', className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const done = isExerciseDone(index, completedIndexes, skippedIndexes);
        const current = index === currentIndex;

        if (done) {
          return (
            <motion.span
              key={index}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-5 w-5 shrink-0 items-center justify-center"
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, delay: reducedMotion ? 0 : index * 0.02 }}
            >
              <GymCompletedCheck className="h-5 w-5" />
            </motion.span>
          );
        }

        return (
          <motion.span
            key={index}
            animate={{ scale: current ? 1.15 : 1 }}
            className={cn(
              'h-2.5 shrink-0 rounded-full transition-colors',
              current ? 'w-2.5 bg-primary ring-4 ring-primary/20' : 'w-2.5 bg-muted-foreground/30',
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
  );
}
