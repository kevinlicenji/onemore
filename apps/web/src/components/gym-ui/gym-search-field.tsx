'use client';

import { cn } from '@onemore/ui';
import { Search } from 'lucide-react';
import type { ReactElement } from 'react';

interface GymSearchFieldProps {
  value: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
}

/**
 * Rounded iOS-style search field with leading icon.
 */
export function GymSearchField({
  value,
  placeholder,
  className,
  onChange,
}: GymSearchFieldProps): ReactElement {
  return (
    <label className={cn('relative block', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        className="min-h-11 w-full rounded-full border border-gym-separator bg-gym-surface py-2 pl-10 pr-4 text-base shadow-sm outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        enterKeyHint="search"
        inputMode="search"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}
