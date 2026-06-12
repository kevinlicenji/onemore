'use client';

import { Button } from '@onemore/ui';
import type { WorkoutSessionDetail } from '@onemore/shared';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { offlineDb } from '@/lib/offline/db';

/**
 * Shows a resume-workout CTA when an in-progress session exists in IndexedDB.
 */
export function OfflineResumeCta({ locale }: { locale: string }): React.ReactElement | null {
  const t = useTranslations('Offline');
  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSession(): Promise<void> {
      try {
        const active = await offlineDb.sessions.where('status').equals('in_progress').first();
        if (!cancelled) {
          setSession(active ?? null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    }

    void loadActiveSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session) {
    return null;
  }

  const label =
    session.workoutDayLabel ??
    (session.sessionType === 'free' ? t('resumeFreeWorkout') : t('resumeWorkout'));

  return (
    <Button asChild className="min-h-11 w-full lg:min-h-12">
      <Link href={`/${locale}/workouts/${session.id}`}>{t('resumeCta', { label })}</Link>
    </Button>
  );
}
