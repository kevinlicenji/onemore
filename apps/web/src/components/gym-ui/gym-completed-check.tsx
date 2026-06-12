'use client';

import { cn } from '@onemore/ui';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactElement } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface GymCompletedCheckProps {
  className?: string;
}

/**
 * Animated checkmark shown when a workout set is logged.
 */
export function GymCompletedCheck({ className }: GymCompletedCheckProps): ReactElement {
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      animate={reducedMotion ? undefined : { scale: 1, opacity: 1 }}
      aria-hidden
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400',
        className,
      )}
      initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
      transition={
        reducedMotion ? undefined : { type: 'spring', stiffness: 520, damping: 26, mass: 0.6 }
      }
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </motion.span>
  );
}
