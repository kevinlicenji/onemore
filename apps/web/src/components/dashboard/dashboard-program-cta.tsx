'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { Button, Card, CardContent, cn } from '@onemore/ui';
import { ArrowRight, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

interface DashboardProgramCtaProps {
  navigation: AnalyticsDashboard['programNavigation'];
  locale: string;
  mobile?: boolean;
}

/**
 * KPI — Program navigation: last completed day → next day with start CTA.
 */
export function DashboardProgramCta({
  navigation,
  locale,
  mobile = false,
}: DashboardProgramCtaProps): ReactElement {
  const t = useTranslations('Dashboard');

  const startHref = navigation.nextWorkoutDayId
    ? `/${locale}/workouts/prepare?dayId=${navigation.nextWorkoutDayId}`
    : `/${locale}/workouts/start`;

  const body = (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Dumbbell aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{t('programSectionTitle')}</p>
          {navigation.hasActiveProgram ? (
            <p className="mt-1 text-base font-semibold">
              {navigation.lastCompletedDayLabel
                ? t('programProgress', {
                    last: navigation.lastCompletedDayLabel,
                    next: navigation.nextDayLabel ?? t('programNextFallback'),
                  })
                : t('programFirstDay', { next: navigation.nextDayLabel ?? t('programNextFallback') })}
            </p>
          ) : (
            <p className="mt-1 text-base text-muted-foreground">{t('programNoActive')}</p>
          )}
          {navigation.programName ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">{navigation.programName}</p>
          ) : null}
        </div>
      </div>
      <Button asChild className={cn(mobile ? 'min-h-12 w-full' : undefined)}>
        <Link href={startHref}>
          {navigation.nextDayLabel
            ? t('startDayCta', { day: navigation.nextDayLabel })
            : t('startWorkoutCta')}
          <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );

  if (mobile) {
    return (
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 shadow-sm">
        {body}
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">{body}</CardContent>
    </Card>
  );
}
