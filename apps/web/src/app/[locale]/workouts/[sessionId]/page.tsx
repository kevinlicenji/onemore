'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { NumberStepper } from '@/components/number-stepper';
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
  skipWorkoutExerciseClient,
  substituteWorkoutExerciseClient,
  updateWorkoutSessionNotesClient,
  upsertWorkoutSetClient,
} from '@/lib/offline/workout-client';
import { POSTHOG_EVENTS, trackEvent } from '@/lib/analytics';

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
  const [substituteMode, setSubstituteMode] = useState(false);
  const [substituteSearch, setSubstituteSearch] = useState('');
  const [substituteResults, setSubstituteResults] = useState<
    Array<{ id: string; names: { en: string; it?: string } }>
  >([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const setRefs = useRef<Record<string, HTMLDivElement | null>>({});
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

  useEffect(() => {
    if (!currentExercise) {
      setActiveSetId(null);
      return;
    }
    const nextSet = currentExercise.sets.find((set) => !set.isCompleted && !set.isSkipped);
    setActiveSetId(nextSet?.id ?? null);
  }, [currentExercise]);

  useEffect(() => {
    if (!activeSetId) {
      return;
    }
    const node = setRefs.current[activeSetId];
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSetId]);

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
      const updatedExercise = result.session.exercises.find(
        (exercise) => exercise.id === currentExercise.id,
      );
      const nextSet = updatedExercise?.sets.find((set) => !set.isCompleted && !set.isSkipped);
      setActiveSetId(nextSet?.id ?? null);

      if (result.personalRecords.length > 0) {
        setNewPrs(result.personalRecords);
        for (const record of result.personalRecords) {
          trackEvent(POSTHOG_EVENTS.PR_ACHIEVED, {
            pr_type: record.prType,
            exercise_id: record.exerciseLibraryId,
            value: record.value,
          });
        }
      }
      await refreshPendingCount();
      setRestSeconds(currentExercise.prescription.restSeconds);
      trackEvent(POSTHOG_EVENTS.SET_COMPLETED, {
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

  function advanceToNextExercise(): void {
    if (!session) {
      return;
    }
    const nextIndex = session.exercises.findIndex(
      (exercise, index) => index > exerciseIndex && exercise.status !== 'skipped',
    );
    if (nextIndex >= 0) {
      setExerciseIndex(nextIndex);
    }
  }

  async function handleSkipExercise(): Promise<void> {
    if (!accessToken || !session || !currentExercise) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await skipWorkoutExerciseClient(accessToken, session.id, currentExercise.id);
      setSession(updated);
      setSubstituteMode(false);
      advanceToNextExercise();
      await refreshPendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('skipExerciseError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubstituteSearch(): Promise<void> {
    if (!accessToken || substituteSearch.trim().length < 2) {
      return;
    }
    const exercises = await searchExercisesClient(accessToken, substituteSearch.trim());
    setSubstituteResults(exercises);
  }

  async function handleSubstitute(exerciseLibraryId: string): Promise<void> {
    if (!accessToken || !session || !currentExercise) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await substituteWorkoutExerciseClient(
        accessToken,
        session.id,
        currentExercise.id,
        exerciseLibraryId,
      );
      setSession(updated);
      setSubstituteMode(false);
      setSubstituteSearch('');
      setSubstituteResults([]);
      const newIndex = updated.exercises.findIndex(
        (exercise) =>
          exercise.substitutedFromExerciseId === currentExercise.exerciseLibraryId ||
          (exercise.exerciseLibraryId === exerciseLibraryId && exercise.status === 'pending'),
      );
      if (newIndex >= 0) {
        setExerciseIndex(newIndex);
      }
      await refreshPendingCount();
      trackEvent(POSTHOG_EVENTS.EXERCISE_SUBSTITUTED, {
        session_id: session.id,
        from_id: currentExercise.exerciseLibraryId,
        to_id: exerciseLibraryId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('substituteError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleNotesChange(notes: string): Promise<void> {
    if (!accessToken || !session) {
      return;
    }
    const privateNotes = notes.trim().length > 0 ? notes : null;
    try {
      const updated = await updateWorkoutSessionNotesClient(accessToken, session.id, privateNotes);
      setSession(updated);
    } catch {
      // Notes are non-blocking; user can retry on blur.
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

        <label className="flex flex-col gap-1 text-sm">
          {t('sessionNotes')}
          <textarea
            className="min-h-20 rounded-md border px-3 py-2 text-sm"
            placeholder={t('sessionNotesPlaceholder')}
            defaultValue={session.privateNotes ?? ''}
            onBlur={(e) => {
              void handleNotesChange(e.target.value);
            }}
          />
        </label>

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
            <h2 className="text-lg font-semibold">
              {locale === 'it' && currentExercise.exercise.names.it
                ? currentExercise.exercise.names.it
                : currentExercise.exercise.names.en}
            </h2>

            {currentExercise.status === 'skipped' ? (
              <p className="text-sm text-muted-foreground">{t('exerciseSkipped')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={loading}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleSkipExercise();
                  }}
                >
                  {t('skipExercise')}
                </Button>
                {session.sessionType === 'programmed' && (
                  <Button
                    disabled={loading}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubstituteMode((value) => !value);
                    }}
                  >
                    {t('substituteExercise')}
                  </Button>
                )}
              </div>
            )}

            {substituteMode && currentExercise.status !== 'skipped' && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <input
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder={t('searchExercises')}
                  value={substituteSearch}
                  onChange={(e) => {
                    setSubstituteSearch(e.target.value);
                  }}
                />
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleSubstituteSearch();
                  }}
                >
                  {t('search')}
                </Button>
                {substituteResults.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    className="rounded border p-2 text-left text-sm"
                    onClick={() => {
                      void handleSubstitute(exercise.id);
                    }}
                  >
                    {locale === 'it' && exercise.names.it ? exercise.names.it : exercise.names.en}
                  </button>
                ))}
              </div>
            )}

            {session.sessionType === 'programmed' && currentExercise.status !== 'skipped' && (
              <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-sm">
                <p className="font-medium">{t('prescribedLabel')}</p>
                <p className="text-muted-foreground">
                  {t('prescriptionDetail', {
                    sets: currentExercise.prescription.targetSets,
                    reps: currentExercise.prescription.targetReps,
                    weight:
                      currentExercise.prescription.targetWeightKg !== null
                        ? `${String(currentExercise.prescription.targetWeightKg)} kg`
                        : t('noTargetWeight'),
                  })}
                </p>
                {currentExercise.prescription.coachNote && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {currentExercise.prescription.coachNote}
                  </p>
                )}
              </div>
            )}

            {currentExercise.sets.map((set) => {
              const prescribedWeight =
                currentExercise.prescription.targetWeightKg !== null
                  ? `${String(currentExercise.prescription.targetWeightKg)} kg`
                  : t('noTargetWeight');
              const previousWeight = currentExercise.previousSet?.weightKg;
              const previousReps = currentExercise.previousSet?.reps;

              return (
                <div
                  key={set.id}
                  ref={(node) => {
                    setRefs.current[set.id] = node;
                  }}
                  className={`rounded-lg border p-3 ${
                    set.isCompleted ? 'bg-muted/50' : ''
                  } ${activeSetId === set.id ? 'border-primary ring-1 ring-primary/30' : ''}`}
                >
                  <p className="text-sm font-medium">{t('setLabel', { number: set.setNumber })}</p>
                  {session.sessionType === 'programmed' ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t('prescribedLabel')}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {currentExercise.prescription.targetReps} {t('reps')}
                        </p>
                        <p className="text-sm text-muted-foreground">{prescribedWeight}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {t('actualLabel')}
                        </p>
                        <div className="mt-1 flex flex-col gap-2">
                          <NumberStepper
                            disabled={set.isCompleted || set.isSkipped}
                            label={t('weightKg')}
                            max={500}
                            placeholder={
                              previousWeight !== null && previousWeight !== undefined
                                ? String(previousWeight)
                                : prescribedWeight
                            }
                            step={2.5}
                            value={set.weightKg}
                            onChange={(value) => {
                              updateSetValue(set.id, 'weightKg', value);
                            }}
                          />
                          <NumberStepper
                            disabled={set.isCompleted || set.isSkipped}
                            label={t('reps')}
                            max={100}
                            placeholder={
                              previousReps !== null && previousReps !== undefined
                                ? String(previousReps)
                                : String(currentExercise.prescription.targetReps)
                            }
                            step={1}
                            value={set.reps}
                            onChange={(value) => {
                              updateSetValue(set.id, 'reps', value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-2">
                      <NumberStepper
                        disabled={set.isCompleted || set.isSkipped}
                        label={t('weightKg')}
                        max={500}
                        step={2.5}
                        value={set.weightKg}
                        onChange={(value) => {
                          updateSetValue(set.id, 'weightKg', value);
                        }}
                      />
                      <NumberStepper
                        disabled={set.isCompleted || set.isSkipped}
                        label={t('reps')}
                        max={100}
                        step={1}
                        value={set.reps}
                        onChange={(value) => {
                          updateSetValue(set.id, 'reps', value);
                        }}
                      />
                    </div>
                  )}
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
              );
            })}

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
