'use client';

import { cn } from '@onemore/ui';
import type { ReactElement } from 'react';

export interface GymSegmentOption<T extends string> {
  value: T;
  label: string;
}

interface GymSegmentedControlProps<T extends string> {
  options: GymSegmentOption<T>[];
  value: T;
  ariaLabel: string;
  className?: string;
  onChange: (value: T) => void;
}

/**
 * Horizontally scrollable segmented control for mobile filters.
 */
export function GymSegmentedControl<T extends string>({
  options,
  value,
  ariaLabel,
  className,
  onChange,
}: GymSegmentedControlProps<T>): ReactElement {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            aria-pressed={active}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-gym-separator bg-gym-surface text-muted-foreground',
            )}
            type="button"
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
