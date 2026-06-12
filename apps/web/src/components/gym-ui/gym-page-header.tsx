'use client';

import { cn } from '@onemore/ui';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

interface GymPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Mobile large-title header with optional back navigation and action slot.
 */
export function GymPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = 'Back',
  className,
}: GymPageHeaderProps): ReactElement {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 -mx-4 border-b border-gym-separator/80 bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md supports-[backdrop-filter]:bg-background/75',
        className,
      )}
    >
      {backHref ? (
        <Link
          className="mb-2 inline-flex min-h-10 items-center gap-0.5 text-sm font-medium text-primary"
          href={backHref}
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-mobile-large-title tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-mobile-footnote leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
