'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { getActiveWorkoutSessionClient } from '@/lib/offline/workout-client';

/**
 * Surfaces an in-progress workout so users can resume after closing the app.
 */
export function ActiveWorkoutBanner(): React.ReactElement | null {
  const t = useTranslations('Workouts');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
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
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
      <p className="text-sm font-medium">{t('resumeTitle')}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {session.workoutDayLabel ?? t('freeWorkoutTitle')}
        {' · '}
        {t('resumeProgress', {
          completed: session.exercises.filter((exercise) => exercise.status === 'completed').length,
          total: session.exercises.length,
        })}
      </p>
      <Button asChild className="mt-3 min-h-11 w-full">
        <Link href={`/${locale}/workouts/${session.id}`}>{t('resumeCta')}</Link>
      </Button>
    </div>
  );
}
