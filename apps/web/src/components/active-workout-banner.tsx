'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useActiveWorkoutSession } from '@/hooks/use-active-workout-session';
import { useIsDesktop } from '@/hooks/use-is-desktop';

/**
 * Surfaces an in-progress workout so users can resume after closing the app.
 */
export function ActiveWorkoutBanner(): React.ReactElement | null {
  const t = useTranslations('Workouts');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const { session } = useActiveWorkoutSession();

  if (!session) {
    return null;
  }

  const completed = session.exercises.filter((exercise) => exercise.status === 'completed').length;

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-gym-tint p-4 shadow-sm">
      <p className="font-semibold">{t('resumeTitle')}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {session.workoutDayLabel ?? t('freeWorkoutTitle')}
        {' · '}
        {t('resumeProgress', { completed, total: session.exercises.length })}
      </p>
      <Button asChild className={isDesktop ? 'mt-3' : 'mt-3 min-h-11 w-full'}>
        <Link href={`/${locale}/workouts/${session.id}`}>{t('resumeCta')}</Link>
      </Button>
    </div>
  );
}
