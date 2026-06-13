'use client';

import type { ReactElement, ReactNode } from 'react';

import { AppLogo } from '@/components/app-logo';

interface AuthPageContentProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Mobile-first auth page body: brand mark, inset form card, optional footer actions.
 */
export function AuthPageContent({ children, footer }: AuthPageContentProps): ReactElement {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex justify-center pt-2">
        <AppLogo size={80} />
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-gym-separator bg-gym-surface shadow-sm">
        <div className="flex w-full flex-col gap-4 p-4">{children}</div>
      </div>

      {footer ? <div className="w-full">{footer}</div> : null}
    </div>
  );
}
