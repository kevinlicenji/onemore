'use client';

import type { ReactElement } from 'react';

/**
 * Inline error banner for auth forms.
 */
export function AuthErrorMessage({ message }: { message: string }): ReactElement {
  return (
    <p
      className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-pretty text-sm text-destructive"
      role="alert"
    >
      {message}
    </p>
  );
}
