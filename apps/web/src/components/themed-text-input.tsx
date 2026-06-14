'use client';

import { cn } from '@onemore/ui';
import type { InputHTMLAttributes } from 'react';

type ThemedTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  className?: string;
};

/**
 * Text field styled for theme-aware contrast (background, foreground, border, placeholder).
 */
export function ThemedTextInput({ className, ...props }: ThemedTextInputProps): React.ReactElement {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
