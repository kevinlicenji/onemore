'use client';

import { cn } from '@onemore/ui';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';

import { GymPageHeader } from '@/components/gym-ui/gym-page-header';
import { GymPullToRefresh } from '@/components/gym-ui/gym-pull-to-refresh';
import { PageEnter } from '@/components/motion/page-enter';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { gymMobilePageContentClassName } from '@/lib/gym-mobile-layout';

import { PageHeader } from './desktop/page-header';
import { PageLayout } from './desktop/page-layout';
import { PageLoadingSkeleton } from './page-loading-skeleton';

type PageLayoutVariant = 'default' | 'wide' | 'centered';

interface AdaptivePageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Mobile header action placement — stacked full-width CTAs by default. */
  actionsLayout?: 'inline' | 'stacked';
  backHref?: string;
  backLabel?: string;
  variant?: PageLayoutVariant;
  mobileClassName?: string;
  /** Mobile-only pull-to-refresh handler for browse list screens. */
  onRefresh?: () => Promise<void>;
  children: ReactNode;
}

/**
 * Renders desktop PageLayout + PageHeader or mobile gym page shell.
 */
export function AdaptivePageShell({
  title,
  description,
  actions,
  actionsLayout = 'stacked',
  backHref,
  backLabel,
  variant = 'default',
  mobileClassName,
  onRefresh,
  children,
}: AdaptivePageShellProps): ReactElement {
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const tGym = useTranslations('Gym');

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
        'mx-auto flex min-h-screen w-full min-w-0 max-w-lg flex-col bg-background',
        mobileClassName,
      )}
    >
      <GymPageHeader
        actions={actions}
        actionsLayout={actionsLayout}
        backHref={backHref}
        backLabel={backLabel}
        description={description}
        title={title}
      />
      {onRefresh ? (
        <GymPullToRefresh
          refreshingLabel={tGym('refreshing')}
          releaseLabel={tGym('releaseToRefresh')}
          onRefresh={onRefresh}
        >
          <PageEnter key={pathname}>
            <div className={gymMobilePageContentClassName}>{children}</div>
          </PageEnter>
        </GymPullToRefresh>
      ) : (
        <PageEnter key={pathname}>
          <div className={gymMobilePageContentClassName}>{children}</div>
        </PageEnter>
      )}
    </main>
  );
}
