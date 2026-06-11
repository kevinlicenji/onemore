'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { fetchHistorySessionDetail } from '@/lib/api-auth';

export default function HistoryDetailPage(): React.ReactElement {
  const t = useTranslations('History');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async (): Promise<void> => {
    if (!accessToken || !sessionId) {
      return;
    }
    try {
      const data = await fetchHistorySessionDetail(accessToken, sessionId);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    }
  }, [accessToken, sessionId, t]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  if (error) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-lg p-6">
          <p className="text-sm text-red-600">{error}</p>
        </main>
      </RequireAuth>
    );
  }

  if (!session) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-lg p-6">
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{session.workoutDayLabel ?? t('freeWorkout')}</h1>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/history`}>{t('backToHistory')}</Link>
          </Button>
        </div>

        {session.completedAt && (
          <p className="text-sm text-muted-foreground">
            {new Date(session.completedAt).toLocaleString(locale)}
            {session.durationSeconds !== null &&
              ` · ${String(Math.round(session.durationSeconds / 60))} min`}
          </p>
        )}

        {session.exercises.map((exercise) => (
          <section key={exercise.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{exercise.exercise.names.en}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {exercise.sets
                .filter((set) => set.isCompleted)
                .map((set) => (
                  <li key={set.id}>
                    {t('setLine', {
                      number: set.setNumber,
                      weight: set.weightKg ?? 0,
                      reps: set.reps ?? 0,
                    })}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </main>
    </RequireAuth>
  );
}
