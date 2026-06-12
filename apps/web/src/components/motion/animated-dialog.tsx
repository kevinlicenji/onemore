'use client';

import { cn } from '@onemore/ui';
import { motion } from 'motion/react';
import type { ReactElement, ReactNode } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface AnimatedDialogProps {
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  onOverlayClick?: () => void;
  ariaLabelledby?: string;
}

/**
 * Modal overlay with enter animation; respects prefers-reduced-motion.
 */
export function AnimatedDialog({
  children,
  className,
  overlayClassName,
  onOverlayClick,
  ariaLabelledby,
}: AnimatedDialogProps): ReactElement {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
          overlayClassName,
        )}
        role="dialog"
        aria-labelledby={ariaLabelledby}
        onClick={onOverlayClick}
      >
        <div
          className={cn('w-full max-w-sm rounded-lg bg-background p-6 shadow-lg', className)}
          onClick={(event) => {
            event.stopPropagation();
          }}
          role="document"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        overlayClassName,
      )}
      role="dialog"
      aria-labelledby={ariaLabelledby}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onOverlayClick}
    >
      <motion.div
        className={cn('w-full max-w-sm rounded-lg bg-background p-6 shadow-lg', className)}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
