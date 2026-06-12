'use client';

import type { ReactElement, ReactNode } from 'react';

import { AnimatedDialog } from '@/components/motion/animated-dialog';
import { useIsDesktop } from '@/hooks/use-is-desktop';

import { GymSheet } from './gym-sheet';

interface GymAdaptiveOverlayProps {
  open: boolean;
  title?: string;
  ariaLabel: string;
  children: ReactNode;
  onClose: () => void;
  /** Use full-height sheet on mobile (search + forms). */
  tall?: boolean;
}

/**
 * Renders a bottom sheet on mobile and a centered dialog on desktop.
 */
export function GymAdaptiveOverlay({
  open,
  title,
  ariaLabel,
  children,
  onClose,
  tall = false,
}: GymAdaptiveOverlayProps): ReactElement | null {
  const isDesktop = useIsDesktop();

  if (!open || isDesktop === null) {
    return null;
  }

  if (isDesktop) {
    return (
      <AnimatedDialog
        ariaLabelledby={title ? 'gym-adaptive-overlay-title' : undefined}
        className="max-w-md rounded-2xl p-0"
        overlayClassName="z-[60] flex items-center justify-center p-4"
        onOverlayClick={onClose}
      >
        <div className="flex flex-col gap-3 p-6">
          {title ? (
            <h2 id="gym-adaptive-overlay-title" className="text-lg font-semibold">
              {title}
            </h2>
          ) : null}
          {children}
        </div>
      </AnimatedDialog>
    );
  }

  return (
    <GymSheet ariaLabel={ariaLabel} open={open} tall={tall} title={title} onClose={onClose}>
      {children}
    </GymSheet>
  );
}
