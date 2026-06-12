'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

import { triggerHaptic } from '@/lib/haptic';

interface GymPressableProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'none';
  onClick?: () => void;
}

/**
 * Touch-friendly wrapper with scale feedback and optional haptic pulse.
 */
export function GymPressable({
  children,
  className,
  disabled = false,
  haptic = 'light',
  onClick,
}: GymPressableProps): ReactElement {
  return (
    <button
      className={cn(
        'transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        className,
      )}
      disabled={disabled}
      type="button"
      onClick={() => {
        if (haptic !== 'none') {
          triggerHaptic(haptic);
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
