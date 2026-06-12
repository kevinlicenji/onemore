'use client';

import { cn, Input } from '@onemore/ui';
import type { ComponentProps, ReactElement } from 'react';

interface GymAuthFieldProps extends ComponentProps<typeof Input> {
  label: string;
  hint?: string;
}

/**
 * Touch-friendly labeled input for auth forms on mobile.
 */
export function GymAuthField({
  label,
  hint,
  className,
  ...inputProps
}: GymAuthFieldProps): ReactElement {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Input
        className={cn(
          'min-h-11 rounded-2xl border-gym-separator bg-background px-4 text-base shadow-sm',
          className,
        )}
        {...inputProps}
      />
      {hint ? <span className="text-pretty text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
