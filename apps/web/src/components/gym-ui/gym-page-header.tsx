'use client';

import { cn } from '@onemore/ui';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

import { AppLogo } from '@/components/app-logo';
import {
  gymMobileHorizontalPadding,
  gymMobileStackedActionsClassName,
} from '@/lib/gym-mobile-layout';

type GymPageHeaderActionsLayout = 'inline' | 'stacked';

interface GymPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Stacked = full-width CTAs below copy; inline = compact slot beside the title. */
  actionsLayout?: GymPageHeaderActionsLayout;
  backHref?: string;
  backLabel?: string;
  showBrandMark?: boolean;
  className?: string;
}

/**
 * Mobile large-title header. Only the title row stays sticky; description and CTAs scroll away.
 */
export function GymPageHeader({
  title,
  description,
  actions,
  actionsLayout = 'stacked',
  backHref,
  backLabel = 'Back',
  showBrandMark = false,
  className,
}: GymPageHeaderProps): ReactElement {
  const showInlineActions = Boolean(actions) && actionsLayout === 'inline';
  const showStackedActions = Boolean(actions) && actionsLayout === 'stacked';

  return (
    <header className={cn('w-full', gymMobileHorizontalPadding, className)}>
      <div
        className={cn(
          'sticky top-0 z-30 -mx-[max(1rem,env(safe-area-inset-left))] border-b border-gym-separator/80 bg-background/90 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:bg-gym-surface/88 dark:supports-[backdrop-filter]:bg-gym-surface/72',
        )}
      >
        {showBrandMark ? <AppLogo className="mb-2" size={28} /> : null}

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
          <h1 className="min-w-0 flex-1 text-balance text-mobile-large-title tracking-tight">
            {title}
          </h1>
          {showInlineActions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>

      {description ? (
        <p className="mt-3 w-full text-pretty text-mobile-footnote leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}

      {showStackedActions ? (
        <div className={cn('mt-4', gymMobileStackedActionsClassName)}>{actions}</div>
      ) : null}
    </header>
  );
}
