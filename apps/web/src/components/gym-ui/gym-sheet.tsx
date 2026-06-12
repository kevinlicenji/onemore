'use client';

import { cn } from '@onemore/ui';
import { motion } from 'motion/react';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface GymSheetProps {
  open: boolean;
  title?: string;
  ariaLabel: string;
  children: ReactNode;
  onClose: () => void;
}

/**
 * Bottom sheet with spring entrance, drag handle, and safe-area padding.
 */
export function GymSheet({
  open,
  title,
  ariaLabel,
  children,
  onClose,
}: GymSheetProps): ReactElement | null {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const sheetMotion = reducedMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 48 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 420, damping: 36 },
      };

  const overlayMotion = reducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <motion.button
        aria-label={ariaLabel}
        className="absolute inset-0 bg-black/45"
        type="button"
        {...overlayMotion}
        onClick={onClose}
      />
      <motion.div
        className={cn(
          'relative z-10 max-h-[min(88dvh,100%)] overflow-hidden rounded-t-3xl border-t border-gym-separator bg-gym-surface-elevated shadow-[0_-12px_40px_rgba(0,0,0,0.12)]',
        )}
        role="dialog"
        aria-label={ariaLabel}
        {...sheetMotion}
      >
        <div className="flex justify-center pt-3">
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        {title ? (
          <h2 className="px-5 pb-2 pt-1 text-base font-semibold">{title}</h2>
        ) : null}
        <div className="overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
