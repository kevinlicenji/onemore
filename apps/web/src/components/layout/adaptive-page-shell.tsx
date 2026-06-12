'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

import { GymPageHeader } from '@/components/gym-ui/gym-page-header';
import { PageEnter } from '@/components/motion/page-enter';
import { useIsDesktop } from '@/hooks/use-is-desktop';

import { PageHeader } from './desktop/page-header';
import { PageLayout } from './desktop/page-layout';
import { PageLoadingSkeleton } from './page-loading-skeleton';

type PageLayoutVariant = 'default' | 'wide' | 'centered';

interface AdaptivePageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  variant?: PageLayoutVariant;
  mobileClassName?: string;
  children: ReactNode;
}

/**
 * Renders desktop PageLayout + PageHeader or mobile gym page shell.
 */
export function AdaptivePageShell({
  title,
  description,
  actions,
  backHref,
  backLabel,
  variant = 'default',
  mobileClassName,
  children,
}: AdaptivePageShellProps): ReactElement {
  const isDesktop = useIsDesktop();

  if (isDesktop === null) {
    return <PageLoadingSkeleton />;
  }

  if (isDesktop) {
    return (
      <PageLayout variant={variant}>
        <PageEnter>
          {variant === 'centered' ? (
            <div className="space-y-2 text-center">
              <h1 className="text-title">{title}</h1>
              {description ? <p className="text-muted-foreground">{description}</p> : null}
            </div>
          ) : (
            <PageHeader title={title} description={description} actions={actions} />
          )}
          {children}
        </PageEnter>
      </PageLayout>
    );
  }

  return (
    <main
      className={cn(
        'mx-auto flex min-h-screen max-w-lg flex-col bg-background',
        variant === 'centered' && 'max-w-md justify-center',
        mobileClassName,
      )}
    >
      <GymPageHeader
        actions={actions}
        backHref={backHref}
        backLabel={backLabel}
        description={description}
        title={title}
      />
      <PageEnter>
        <div className="flex flex-col gap-5 px-4 pb-6 pt-4 sm:px-6">{children}</div>
      </PageEnter>
    </main>
  );
}
