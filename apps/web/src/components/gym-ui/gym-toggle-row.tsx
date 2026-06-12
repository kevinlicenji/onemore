'use client';

import { cn } from '@onemore/ui';
import type { ReactElement } from 'react';

interface GymToggleRowProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * iOS-style switch row for mobile settings lists.
 */
export function GymToggleRow({
  label,
  checked,
  disabled = false,
  onChange,
}: GymToggleRowProps): ReactElement {
  return (
    <button
      aria-checked={checked}
      className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-base transition-colors active:bg-muted/40 disabled:opacity-50"
      disabled={disabled}
      role="switch"
      type="button"
      onClick={() => {
        onChange(!checked);
      }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
