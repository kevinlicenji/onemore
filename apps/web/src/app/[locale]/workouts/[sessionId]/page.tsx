'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { PrCelebration } from '@/components/pr-celebration';
import { RestTimer } from '@/components/rest-timer';
import { RequireAuth } from '@/components/require-auth';
import { useSync } from '@/components/sync-provider';
import {
  abandonWorkoutSessionClient,
  addWorkoutExerciseClient,
  completeWorkoutSessionClient,
  getWorkoutSessionClient,
  searchExercisesClient,
  upsertWorkoutSetClient,
} from '@/lib/offline/workout-client';
import { trackEvent } from '@/lib/analytics';

export default function ActiveWorkoutPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; names: { en: string } }>>(
    [],
  );
  const [newPrs, setNewPrs] = useState<PersonalRecordSummary[]>([]);
  const { refreshPendingCount } = useSync();

  const loadSession = useCallback(async (): Promise<void> => {
    if (!accessToken || !sessionId) {
      return;
    }
    const data = await getWorkoutSessionClient(accessToken, sessionId);
    setSession(data);
  }, [accessToken, sessionId]);

  useEffect(() => {
    if (!accessToken || !sessionId) {
      return;
    }
    void loadSession().catch(() => {
      setError(t('loadError'));
    });
  }, [accessToken, sessionId, loadSession, t]);

  const currentExercise = useMemo(() => {
    if (!session || session.exercises.length === 0) {
      return null;
    }
    return session.exercises[exerciseIndex] ?? session.exercises[0] ?? null;
  }, [session, exerciseIndex]);

  async function handleCompleteSet(setId: string, setNumber: number): Promise<void> {
    if (!accessToken || !session || !currentExercise) {
      return;
    }
    const set = currentExercise.sets.find((item) => item.id === setId);
    if (!set) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await upsertWorkoutSetClient(accessToken, session.id, {
        id: setId,
        exerciseExecutionId: currentExercise.id,
        setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        isCompleted: true,
        isSkipped: false,
        isFailed: false,
        isWarmup: set.isWarmup,
        clientTimestamp: new Date().toISOString(),
      });
      setSession(result.session);
      if (result.personalRecords.length > 0) {
        setNewPrs(result.personalRecords);
        for (const record of result.personalRecords) {
          trackEvent('pr_achieved', {
            pr_type: record.prType,
            exercise_id: record.exerciseLibraryId,
            value: record.value,
          });
        }
      }
      await refreshPendingCount();
      setRestSeconds(currentExercise.prescription.restSeconds);
      trackEvent('set_completed', {
        session_id: session.id,
        exercise_id: currentExercise.exerciseLibraryId,
        set_number: setNumber,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipSet(setId: string, setNumber: number): Promise<void> {
    if (!accessToken || !session || !currentExercise) {
      return;
    }
    const set = currentExercise.sets.find((item) => item.id === setId);
    if (!set) {
      return;
    }

    setLoading(true);
    try {
      const result = await upsertWorkoutSetClient(accessToken, session.id, {
        id: setId,
        exerciseExecutionId: currentExercise.id,
        setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        isCompleted: false,
        isSkipped: true,
        isFailed: false,
        isWarmup: set.isWarmup,
        clientTimestamp: new Date().toISOString(),
      });
      setSession(result.session);
      await refreshPendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setError'));
    } finally {
      setLoading(false);
    }
  }

  function updateSetValue(setId: string, field: 'weightKg' | 'reps', value: number | null): void {
    if (!session || !currentExercise) {
      return;
    }
    setSession({
      ...session,
      exercises: session.exercises.map((exercise) =>
        exercise.id === currentExercise.id
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    });
  }

  async function handleSearch(): Promise<void> {
    if (!accessToken || search.trim().length < 2) {
      return;
    }
    const exercises = await searchExercisesClient(accessToken, search.trim());
    setSearchResults(exercises);
  }

  async function handleAddExercise(exerciseLibraryId: string): Promise<void> {
    if (!accessToken || !session) {
      return;
    }
    setLoading(true);
    try {
      const updated = await addWorkoutExerciseClient(accessToken, session.id, {
        exerciseLibraryId,
        targetSets: 3,
        targetReps: 10,
        restSeconds: 90,
      });
      setSession(updated);
      setExerciseIndex(updated.exercises.length - 1);
      setSearch('');
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addExerciseError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteWorkout(): Promise<void> {
    if (!accessToken || !session) {
      return;
    }
    setLoading(true);
    try {
      await completeWorkoutSessionClient(accessToken, session.id);
      trackEvent('workout_completed', { session_id: session.id });
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('completeError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAbandon(): Promise<void> {
    if (!accessToken || !session) {
      return;
    }
    setLoading(true);
    try {
      await abandonWorkoutSessionClient(accessToken, session.id);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('abandonError'));
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-md p-6">
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      {newPrs.length > 0 && (
        <PrCelebration
          records={newPrs}
          onDismiss={() => {
            setNewPrs([]);
          }}
        />
      )}
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6 pb-24">
        <div>
          <h1 className="text-xl font-bold">{session.workoutDayLabel ?? t('freeWorkoutTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('exerciseProgress', {
              current: Math.min(exerciseIndex + 1, Math.max(session.exercises.length, 1)),
              total: Math.max(session.exercises.length, 1),
            })}
          </p>
        </div>

        {restSeconds !== null && (
          <RestTimer
            label={t('restLabel')}
            seconds={restSeconds}
            skipLabel={t('skipRest')}
            onComplete={() => {
              setRestSeconds(null);
            }}
          />
        )}

        {session.sessionType === 'free' && session.exercises.length === 0 && (
          <div className="flex flex-col gap-2">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder={t('searchExercises')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleSearch();
              }}
            >
              {t('search')}
            </Button>
            {searchResults.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className="rounded border p-2 text-left text-sm"
                onClick={() => {
                  void handleAddExercise(exercise.id);
                }}
              >
                {exercise.names.en}
              </button>
            ))}
          </div>
        )}

        {currentExercise && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{currentExercise.exercise.names.en}</h2>
            <p className="text-sm text-muted-foreground">
              {t('prescriptionMeta', {
                sets: currentExercise.prescription.targetSets,
                reps: currentExercise.prescription.targetReps,
              })}
            </p>

            {currentExercise.sets.map((set) => (
              <div
                key={set.id}
                className={`rounded-lg border p-3 ${set.isCompleted ? 'bg-muted/50' : ''}`}
              >
                <p className="text-sm font-medium">{t('setLabel', { number: set.setNumber })}</p>
                <div className="mt-2 flex gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    {t('weightKg')}
                    <input
                      className="rounded border px-2 py-1"
                      disabled={set.isCompleted || set.isSkipped}
                      inputMode="decimal"
                      type="number"
                      value={set.weightKg ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        updateSetValue(set.id, 'weightKg', value);
                      }}
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    {t('reps')}
                    <input
                      className="rounded border px-2 py-1"
                      disabled={set.isCompleted || set.isSkipped}
                      inputMode="numeric"
                      type="number"
                      value={set.reps ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        updateSetValue(set.id, 'reps', value);
                      }}
                    />
                  </label>
                </div>
                {!set.isCompleted && !set.isSkipped && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      className="min-h-11 flex-1"
                      disabled={loading}
                      type="button"
                      onClick={() => {
                        void handleCompleteSet(set.id, set.setNumber);
                      }}
                    >
                      {t('completeSet')}
                    </Button>
                    <Button
                      disabled={loading}
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void handleSkipSet(set.id, set.setNumber);
                      }}
                    >
                      {t('skipSet')}
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                disabled={exerciseIndex === 0}
                type="button"
                variant="outline"
                onClick={() => {
                  setExerciseIndex((value) => Math.max(0, value - 1));
                }}
              >
                {t('prevExercise')}
              </Button>
              <Button
                disabled={exerciseIndex >= session.exercises.length - 1}
                type="button"
                variant="outline"
                onClick={() => {
                  setExerciseIndex((value) => Math.min(session.exercises.length - 1, value + 1));
                }}
              >
                {t('nextExercise')}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
          <div className="mx-auto flex max-w-md gap-2">
            <Button
              className="min-h-11 flex-1"
              disabled={loading || session.exercises.length === 0}
              type="button"
              onClick={() => {
                void handleCompleteWorkout();
              }}
            >
              {t('finishWorkout')}
            </Button>
            <Button
              disabled={loading}
              type="button"
              variant="outline"
              onClick={() => {
                void handleAbandon();
              }}
            >
              {t('abandon')}
            </Button>
          </div>
        </div>

        <Button asChild className="invisible" variant="ghost">
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
