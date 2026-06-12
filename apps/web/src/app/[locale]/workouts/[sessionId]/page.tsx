'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ExerciseActionsMenu } from '@/components/exercise-actions-menu';
import { ExerciseNotesModal } from '@/components/exercise-notes-modal';
import { ExerciseSearchCombobox } from '@/components/exercise-search-combobox';
import { SetMetricInput } from '@/components/set-metric-input';
import { PrCelebration } from '@/components/pr-celebration';
import { RestTimer } from '@/components/rest-timer';
import { RequireAuth } from '@/components/require-auth';
import { useSync } from '@/components/sync-provider';
import {
  abandonWorkoutSessionClient,
  addWorkoutExerciseClient,
  addWorkoutExerciseSetClient,
  completeWorkoutSessionClient,
  getWorkoutSessionClient,
  skipWorkoutExerciseClient,
  substituteWorkoutExerciseClient,
  updateWorkoutExerciseNotesClient,
  upsertWorkoutSetClient,
} from '@/lib/offline/workout-client';
import { POSTHOG_EVENTS, trackEvent } from '@/lib/analytics';

export default function ActiveWorkoutPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const { accessToken, setSession: setAuthSession, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [restTimerContext, setRestTimerContext] = useState<{
    setId: string;
    seconds: number;
  } | null>(null);
  const [actualRestBySetId, setActualRestBySetId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPrs, setNewPrs] = useState<PersonalRecordSummary[]>([]);
  const [substituteMode, setSubstituteMode] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined' || !sessionId) {
      return;
    }
    try {
      const raw = sessionStorage.getItem(`workout-rest-${sessionId}`);
      if (raw) {
        setActualRestBySetId(JSON.parse(raw) as Record<string, number>);
      }
    } catch {
      setActualRestBySetId({});
    }
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !sessionId) {
      return;
    }
    sessionStorage.setItem(`workout-rest-${sessionId}`, JSON.stringify(actualRestBySetId));
  }, [actualRestBySetId, sessionId]);

  const currentExercise = useMemo(() => {
    if (!session || session.exercises.length === 0) {
      return null;
    }
    return session.exercises[exerciseIndex] ?? session.exercises[0] ?? null;
  }, [session, exerciseIndex]);

  useEffect(() => {
    if (!currentExercise || restTimerContext !== null) {
      if (!currentExercise) {
        setActiveSetId(null);
      }
      return;
    }
    const nextSet = currentExercise.sets.find((set) => !set.isCompleted && !set.isSkipped);
    setActiveSetId(nextSet?.id ?? null);
  }, [currentExercise, restTimerContext]);

  useEffect(() => {
    setSubstituteMode(false);
    setNotesModalOpen(false);
  }, [exerciseIndex]);

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
      const result = await upsertWorkoutSetClient(
        accessToken,
        session.id,
        {
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
        },
        { onAccessTokenRefreshed: handleAccessTokenRefreshed },
      );
      setSession(result.session);

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
      setRestTimerContext({
        setId,
        seconds: currentExercise.prescription.restSeconds,
      });
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
      const result = await upsertWorkoutSetClient(
        accessToken,
        session.id,
        {
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
        },
        { onAccessTokenRefreshed: handleAccessTokenRefreshed },
      );
      setSession(result.session);
      const updatedExercise = result.session.exercises.find(
        (exercise) => exercise.id === currentExercise.id,
      );
      const nextSet = updatedExercise?.sets.find((item) => !item.isCompleted && !item.isSkipped);
      setActiveSetId(nextSet?.id ?? null);
      await refreshPendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setError'));
    } finally {
      setLoading(false);
    }
  }

  function formatPrescribedWeight(targetWeightKg: number | null): string {
    if (targetWeightKg !== null) {
      return String(targetWeightKg);
    }
    return '—';
  }

  function formatSetPrescriptionLine(
    targetReps: number,
    targetWeightKg: number | null,
    restSeconds: number,
  ): string {
    const weightPart = targetWeightKg !== null ? `${targetWeightKg}kg` : '—';
    return `${targetReps} x ${weightPart} (${restSeconds}')`;
  }

  function formatLoggedSetLine(
    reps: number | null,
    weightKg: number | null,
    restSeconds: number | null,
    targetReps: number,
    targetWeightKg: number | null,
  ): string {
    const loggedReps = reps ?? targetReps;
    const weightPart = weightKg !== null ? `${weightKg}kg` : '—';
    const base = `${loggedReps} x ${weightPart}`;
    if (restSeconds === null) {
      return base;
    }
    return `${base} (${restSeconds}')`;
  }

  function handleAccessTokenRefreshed(token: string): void {
    if (user) {
      setAuthSession(token, user);
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

  function isExtraSet(setNumber: number, prescribedSets: number): boolean {
    return setNumber > prescribedSets;
  }

  async function handleAddSet(): Promise<void> {
    if (!accessToken || !session || !currentExercise) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await addWorkoutExerciseSetClient(
        accessToken,
        session.id,
        currentExercise.id,
      );
      setSession(updated);
      const updatedExercise = updated.exercises.find(
        (exercise) => exercise.id === currentExercise.id,
      );
      const nextSet = updatedExercise?.sets.find((set) => !set.isCompleted && !set.isSkipped);
      setActiveSetId(nextSet?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addSetError'));
    } finally {
      setLoading(false);
    }
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

  function openNotesModal(): void {
    setNotesModalOpen(true);
  }

  async function handleExerciseNotesSave(notes: string): Promise<void> {
    if (!accessToken || !session || !currentExercise) {
      return;
    }
    const athleteNotes = notes.trim().length > 0 ? notes.trim() : null;
    setNotesSaving(true);
    try {
      const updated = await updateWorkoutExerciseNotesClient(
        accessToken,
        session.id,
        currentExercise.id,
        athleteNotes,
      );
      setSession(updated);
      setNotesModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notesSaveError'));
    } finally {
      setNotesSaving(false);
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
        </div>

        {restTimerContext !== null && (
          <RestTimer
            label={t('restLabel')}
            nextSetLabel={t('nextSet')}
            seconds={restTimerContext.seconds}
            onNextSet={(actualRestSeconds) => {
              setActualRestBySetId((prev) => ({
                ...prev,
                [restTimerContext.setId]: actualRestSeconds,
              }));
              setRestTimerContext(null);
            }}
          />
        )}

        {session.sessionType === 'free' && accessToken && session.exercises.length === 0 && (
          <ExerciseSearchCombobox
            accessToken={accessToken}
            disabled={loading}
            locale={locale}
            noResultsLabel={t('searchNoResults')}
            placeholder={t('searchExercises')}
            searchingLabel={t('searchingExercises')}
            onSelect={(exercise) => {
              void handleAddExercise(exercise.id);
            }}
          />
        )}

        {currentExercise && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-lg font-semibold">
                  <span>
                    {locale === 'it' && currentExercise.exercise.names.it
                      ? currentExercise.exercise.names.it
                      : currentExercise.exercise.names.en}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {t('exerciseSubtitle', {
                      sets: currentExercise.prescription.targetSets,
                      reps: currentExercise.prescription.targetReps,
                    })}
                  </span>
                </h2>
              </div>
              {currentExercise.status !== 'skipped' && (
                <ExerciseActionsMenu
                  disabled={loading}
                  labels={{
                    menu: t('exerciseActionsMenu'),
                    notes: t('menuNotes'),
                    substitute: t('substituteExercise'),
                    skip: t('skipExercise'),
                  }}
                  showSubstitute={session.sessionType === 'programmed'}
                  onNotes={openNotesModal}
                  onSkip={() => {
                    void handleSkipExercise();
                  }}
                  onSubstitute={() => {
                    setSubstituteMode(true);
                  }}
                />
              )}
            </div>

            {currentExercise.status === 'skipped' && (
              <p className="text-sm text-muted-foreground">{t('exerciseSkipped')}</p>
            )}

            {(() => {
              const { prescription } = currentExercise;
              const isResting = restTimerContext !== null;
              const activeSet = isResting
                ? null
                : (currentExercise.sets.find((item) => !item.isCompleted && !item.isSkipped) ??
                  null);
              const previousWeight = currentExercise.previousSet?.weightKg;
              const previousReps = currentExercise.previousSet?.reps;
              const lastLoggedSet = [...currentExercise.sets]
                .filter((item) => item.isCompleted && !item.isSkipped)
                .sort((a, b) => b.setNumber - a.setNumber)[0];
              const lastSetInExercise = [...currentExercise.sets].sort(
                (a, b) => b.setNumber - a.setNumber,
              )[0];
              const extraPlaceholderSource = lastLoggedSet ?? lastSetInExercise;

              function getRepsPlaceholder(forExtraSet: boolean): string {
                if (forExtraSet) {
                  if (extraPlaceholderSource?.reps !== null && extraPlaceholderSource?.reps !== undefined) {
                    return String(extraPlaceholderSource.reps);
                  }
                  return t('placeholderReps');
                }
                if (previousReps !== null && previousReps !== undefined) {
                  return String(previousReps);
                }
                return String(prescription.targetReps);
              }

              function getWeightPlaceholder(forExtraSet: boolean): string {
                if (forExtraSet) {
                  if (
                    extraPlaceholderSource?.weightKg !== null &&
                    extraPlaceholderSource?.weightKg !== undefined
                  ) {
                    return String(extraPlaceholderSource.weightKg);
                  }
                  return t('placeholderWeight');
                }
                if (previousWeight !== null && previousWeight !== undefined) {
                  return String(previousWeight);
                }
                return formatPrescribedWeight(prescription.targetWeightKg) === '—'
                  ? t('placeholderWeight')
                  : formatPrescribedWeight(prescription.targetWeightKg);
              }

              const completedSets = currentExercise.sets.filter(
                (item) => item.isCompleted || item.isSkipped,
              );
              const futureSets = isResting
                ? currentExercise.sets.filter((item) => !item.isCompleted && !item.isSkipped)
                : activeSet
                  ? currentExercise.sets.filter(
                      (item) =>
                        !item.isCompleted && !item.isSkipped && item.id !== activeSet.id,
                    )
                  : [];

              function getDisplayedRestSeconds(setId: string): number | null {
                if (restTimerContext?.setId === setId) {
                  return null;
                }
                if (actualRestBySetId[setId] !== undefined) {
                  return actualRestBySetId[setId];
                }
                return prescription.restSeconds;
              }

              return (
                <div className="flex flex-col gap-3">
                  {completedSets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/35 px-3 py-2.5 text-sm"
                    >
                      {set.isCompleted ? (
                        <svg
                          aria-hidden
                          className="h-5 w-5 shrink-0 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <path d="m8 12.5 2.5 2.5L16 9.5" />
                        </svg>
                      ) : (
                        <svg
                          aria-hidden
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12h8" />
                        </svg>
                      )}
                      <span className="font-medium text-foreground/80">
                        {t('setLabel', { number: set.setNumber })}
                      </span>
                      {set.isSkipped ? (
                        <span className="ml-auto flex items-center">
                          <span
                            aria-hidden
                            className="h-0.5 w-8 rounded-full bg-muted-foreground/70"
                          />
                          <span className="sr-only">{t('setSkippedLabel')}</span>
                        </span>
                      ) : (
                        <span className="ml-auto text-muted-foreground">
                          {formatLoggedSetLine(
                            set.reps,
                            set.weightKg,
                            getDisplayedRestSeconds(set.id),
                            prescription.targetReps,
                            prescription.targetWeightKg,
                          )}
                        </span>
                      )}
                    </div>
                  ))}

                  {completedSets.length > 0 && (activeSet !== null || isResting) && (
                    <div aria-hidden className="flex items-center py-1">
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}

                  {activeSet && (
                    <div
                      ref={(node) => {
                        setRefs.current[activeSet.id] = node;
                      }}
                      className="mx-auto w-full max-w-sm rounded-xl border border-primary p-4 shadow-sm ring-1 ring-primary/25"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p className="text-base font-semibold">
                          {t('setLabel', { number: activeSet.setNumber })}
                        </p>
                        {!isExtraSet(activeSet.setNumber, prescription.targetSets) && (
                          <p className="text-sm text-muted-foreground">
                            {formatSetPrescriptionLine(
                              prescription.targetReps,
                              prescription.targetWeightKg,
                              prescription.restSeconds,
                            )}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <SetMetricInput
                          inputMode="numeric"
                          max={100}
                          placeholder={getRepsPlaceholder(
                            isExtraSet(activeSet.setNumber, prescription.targetSets),
                          )}
                          size="sm"
                          value={activeSet.reps}
                          onChange={(value) => {
                            updateSetValue(activeSet.id, 'reps', value);
                          }}
                        />
                        <SetMetricInput
                          max={500}
                          placeholder={getWeightPlaceholder(
                            isExtraSet(activeSet.setNumber, prescription.targetSets),
                          )}
                          size="sm"
                          value={activeSet.weightKg}
                          onChange={(value) => {
                            updateSetValue(activeSet.id, 'weightKg', value);
                          }}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Button
                          className="min-h-11"
                          disabled={loading}
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void handleSkipSet(activeSet.id, activeSet.setNumber);
                          }}
                        >
                          {t('skipSet')}
                        </Button>
                        <Button
                          className="min-h-11"
                          disabled={loading}
                          type="button"
                          onClick={() => {
                            void handleCompleteSet(activeSet.id, activeSet.setNumber);
                          }}
                        >
                          {t('completeSet')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {futureSets.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                      {futureSets.map((set) => (
                        <div
                          key={set.id}
                          className="mx-auto w-[92%] rounded-lg border border-dashed border-muted-foreground/25 bg-muted/15 px-3 py-2 opacity-60"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('setLabel', { number: set.setNumber })}
                          </p>
                          {!isExtraSet(set.setNumber, prescription.targetSets) && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                              {formatSetPrescriptionLine(
                                prescription.targetReps,
                                prescription.targetWeightKg,
                                prescription.restSeconds,
                              )}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {!restTimerContext &&
              currentExercise.status !== 'skipped' &&
              !currentExercise.sets.some((set) => !set.isCompleted && !set.isSkipped) && (
                <Button
                  className="w-full"
                  disabled={loading}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleAddSet();
                  }}
                >
                  {t('addSet')}
                </Button>
              )}

            {substituteMode && currentExercise.status !== 'skipped' && accessToken && (
              <div className="rounded-lg border p-3">
                <ExerciseSearchCombobox
                  accessToken={accessToken}
                  disabled={loading}
                  locale={locale}
                  noResultsLabel={t('searchNoResults')}
                  placeholder={t('searchExercises')}
                  searchingLabel={t('searchingExercises')}
                  onSelect={(exercise) => {
                    void handleSubstitute(exercise.id);
                  }}
                />
              </div>
            )}

            {currentExercise.athleteNotes && (
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm italic text-muted-foreground">
                  {currentExercise.athleteNotes}
                </p>
                <button
                  aria-label={t('editNotes')}
                  className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  type="button"
                  onClick={openNotesModal}
                >
                  <svg
                    aria-hidden
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              </div>
            )}

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

            <ExerciseNotesModal
              cancelLabel={t('cancel')}
              initialValue={currentExercise.athleteNotes ?? ''}
              open={notesModalOpen}
              placeholder={t('notesPlaceholder')}
              saveLabel={t('saveNotes')}
              saving={notesSaving}
              title={t('notesModalTitle')}
              onClose={() => {
                setNotesModalOpen(false);
              }}
              onSave={(notes) => {
                void handleExerciseNotesSave(notes);
              }}
            />
          </div>
        )}

        {session.sessionType === 'free' && accessToken && session.exercises.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t('addExercise')}</p>
            <ExerciseSearchCombobox
              accessToken={accessToken}
              disabled={loading}
              locale={locale}
              noResultsLabel={t('searchNoResults')}
              placeholder={t('searchExercises')}
              searchingLabel={t('searchingExercises')}
              onSelect={(exercise) => {
                void handleAddExercise(exercise.id);
              }}
            />
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
