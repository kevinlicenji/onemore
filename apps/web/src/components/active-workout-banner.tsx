'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { getActiveWorkoutSessionClient } from '@/lib/offline/workout-client';

/**
 * Surfaces an in-progress workout so users can resume after closing the app.
 */
export function ActiveWorkoutBanner(): React.ReactElement | null {
  const t = useTranslations('Workouts');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void getActiveWorkoutSessionClient(accessToken)
      .then(setSession)
      .catch(() => {
        setSession(null);
      });
  }, [accessToken]);

  if (!session) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-gym-tint p-4 shadow-sm">
      <p className="font-semibold">{t('resumeTitle')}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {session.workoutDayLabel ?? t('freeWorkoutTitle')}
        {' · '}
        {t('resumeProgress', {
          completed: session.exercises.filter((exercise) => exercise.status === 'completed').length,
          total: session.exercises.length,
        })}
      </p>
      <Button asChild className={isDesktop ? 'mt-3' : 'mt-3 min-h-11 w-full'}>
        <Link href={`/${locale}/workouts/${session.id}`}>{t('resumeCta')}</Link>
      </Button>
    </div>
  );
}
