'use client';

import type { ReactElement, ReactNode } from 'react';

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
        <img
          alt="OneMore"
          className="h-20 w-20 rounded-[1.35rem] border border-gym-separator bg-white object-cover shadow-sm"
          height={80}
          src="/apple-touch-icon.png"
          width={80}
        />
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-gym-separator bg-gym-surface shadow-sm">
        <div className="flex w-full flex-col gap-4 p-4">{children}</div>
      </div>

      {footer ? <div className="w-full">{footer}</div> : null}
    </div>
  );
}
