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
import { MetricInput } from '@/components/metric-input';
import { PrCelebration } from '@/components/pr-celebration';
import { RestTimer } from '@/components/rest-timer';
import { RequireAuth } from '@/components/require-auth';
import { useSync } from '@/components/sync-provider';
import { GymActiveWorkoutView } from '@/components/workout/gym-active-workout-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { buildExerciseSetViewState, isExtraSet } from '@/lib/workout-exercise-set-state';
import { formatLoggedSetLine, formatSetPrescriptionLine } from '@/lib/workout-set-display';
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
import {
  findNextActiveExerciseIndex,
  isExerciseFullyResolved,
  isWorkoutReadyToAutoFinish,
  shouldOfferAddSet,
} from '@/lib/workout-completion';

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
  const autoFinishTriggeredRef = useRef(false);
  const { refreshPendingCount } = useSync();
  const isDesktop = useIsDesktop();

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

  function maybeAdvanceAfterExerciseDone(
    updatedSession: WorkoutSessionDetail,
    fromIndex: number,
  ): void {
    const exercise = updatedSession.exercises[fromIndex];
    if (!exercise || !isExerciseFullyResolved(exercise) || shouldOfferAddSet(exercise)) {
      return;
    }
    const nextIndex = findNextActiveExerciseIndex(updatedSession, fromIndex);
    if (nextIndex >= 0) {
      setExerciseIndex(nextIndex);
    }
  }

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
      maybeAdvanceAfterExerciseDone(result.session, exerciseIndex);
      await refreshPendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setError'));
    } finally {
      setLoading(false);
    }
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

  const handleCompleteWorkout = useCallback(async (): Promise<void> => {
    if (!accessToken || !session) {
      return;
    }
    setLoading(true);
    try {
      await completeWorkoutSessionClient(accessToken, session.id);
      trackEvent('workout_completed', { session_id: session.id });
      if (typeof window !== 'undefined' && newPrs.length > 0) {
        sessionStorage.setItem(`workout-summary-prs-${session.id}`, JSON.stringify(newPrs));
      }
      router.push(`/${locale}/workouts/${session.id}/summary`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('completeError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, locale, newPrs, router, session, t]);

  const tryAutoFinishWorkout = useCallback((): void => {
    if (!session || loading || restTimerContext !== null) {
      return;
    }
    if (!isWorkoutReadyToAutoFinish(session)) {
      autoFinishTriggeredRef.current = false;
      return;
    }
    if (autoFinishTriggeredRef.current) {
      return;
    }
    autoFinishTriggeredRef.current = true;
    void handleCompleteWorkout();
  }, [handleCompleteWorkout, loading, restTimerContext, session]);

  function advanceToNextExercise(updatedSession: WorkoutSessionDetail): void {
    const nextIndex = findNextActiveExerciseIndex(updatedSession, exerciseIndex);
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
      advanceToNextExercise(updated);
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

  useEffect(() => {
    tryAutoFinishWorkout();
  }, [tryAutoFinishWorkout]);

  if (!session || isDesktop === null) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-md p-6">
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </main>
      </RequireAuth>
    );
  }

  const activeExercises = session.exercises.filter((exercise) => exercise.status !== 'skipped');
  const exercisePosition =
    currentExercise !== null
      ? activeExercises.findIndex((exercise) => exercise.id === currentExercise.id) + 1
      : 0;
  const exerciseProgressText = t('exerciseProgress', {
    current: Math.max(exercisePosition, 1),
    total: Math.max(activeExercises.length, 1),
  });

  const gymLabels = {
    freeWorkoutTitle: t('freeWorkoutTitle'),
    restLabel: t('restLabel'),
    nextSet: t('nextSet'),
    searchExercises: t('searchExercises'),
    searchNoResults: t('searchNoResults'),
    searchingExercises: t('searchingExercises'),
    addExercise: t('addExercise'),
    exerciseSkipped: t('exerciseSkipped'),
    setSkippedLabel: t('setSkippedLabel'),
    reps: t('reps'),
    weightKg: t('weightKg'),
    completeSetGym: t('completeSetGym'),
    addSet: t('addSet'),
    addSetPrompt: t('addSetPrompt'),
    exerciseActionsMenu: t('exerciseActionsMenu'),
    menuNotes: t('menuNotes'),
    substituteExercise: t('substituteExercise'),
    skipExercise: t('skipExercise'),
    skipSet: t('skipSet'),
    finishWorkout: t('finishWorkout'),
    abandon: t('abandon'),
    notesPlaceholder: t('notesPlaceholder'),
    notesModalTitle: t('notesModalTitle'),
    saveNotes: t('saveNotes'),
    cancel: t('cancel'),
    editNotes: t('editNotes'),
    placeholderReps: t('placeholderReps'),
    placeholderWeight: t('placeholderWeight'),
    failureReps: t('failureReps'),
    prevExercise: t('prevExercise'),
    nextExercise: t('nextExercise'),
    swipeHint: t('swipeHint'),
    elapsedLabel: t('elapsedLabel'),
    homeLabel: t('homeLabel'),
    previousSetLabel: t('previousSetLabel'),
  };

  if (!isDesktop) {
    return (
      <RequireAuth>
        <GymActiveWorkoutView
          accessToken={accessToken}
          actualRestBySetId={actualRestBySetId}
          currentExercise={currentExercise}
          error={error}
          exerciseIndex={exerciseIndex}
          exerciseProgressText={exerciseProgressText}
          formatSetLabel={(setNumber) => t('setLabel', { number: setNumber })}
          labels={gymLabels}
          loading={loading}
          locale={locale}
          newPrs={newPrs}
          notesModalOpen={notesModalOpen}
          notesSaving={notesSaving}
          restTimerContext={restTimerContext}
          session={session}
          substituteMode={substituteMode}
          onAbandon={() => {
            void handleAbandon();
          }}
          onAddSet={() => {
            void handleAddSet();
          }}
          onCompleteSet={(setId, setNumber) => {
            void handleCompleteSet(setId, setNumber);
          }}
          onDismissPr={() => {
            setNewPrs([]);
          }}
          onExerciseIndexChange={setExerciseIndex}
          onFinishWorkout={() => {
            void handleCompleteWorkout();
          }}
          onNotesModalClose={() => {
            setNotesModalOpen(false);
          }}
          onNotesSave={(notes) => {
            void handleExerciseNotesSave(notes);
          }}
          onOpenNotes={openNotesModal}
          onOpenSubstitute={() => {
            setSubstituteMode(true);
          }}
          onRestComplete={(setId, actualRestSeconds) => {
            setActualRestBySetId((prev) => ({
              ...prev,
              [setId]: actualRestSeconds,
            }));
            setRestTimerContext(null);
            maybeAdvanceAfterExerciseDone(session, exerciseIndex);
          }}
          onSelectExerciseToAdd={(exerciseLibraryId) => {
            void handleAddExercise(exerciseLibraryId);
          }}
          onSelectSubstitute={(exerciseLibraryId) => {
            void handleSubstitute(exerciseLibraryId);
          }}
          onSkipExercise={() => {
            void handleSkipExercise();
          }}
          onSkipSet={(setId, setNumber) => {
            void handleSkipSet(setId, setNumber);
          }}
          onUpdateSetValue={updateSetValue}
        />
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
              const setState = buildExerciseSetViewState({
                exercise: currentExercise,
                restTimerContext,
                actualRestBySetId,
                labels: {
                  placeholderReps: t('placeholderReps'),
                  placeholderWeight: t('placeholderWeight'),
                  failureReps: t('failureReps'),
                },
              });
              const { activeSet, completedSets, futureSets, isResting } = setState;

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
                            setState.getDisplayedRestSeconds(set.id),
                            prescription.targetReps,
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
                              t('failureReps'),
                            )}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <MetricInput
                          kind="reps"
                          label={t('reps')}
                          placeholder={setState.getRepsPlaceholder(
                            isExtraSet(activeSet.setNumber, prescription.targetSets),
                          )}
                          value={activeSet.reps}
                          onChange={(value) => {
                            updateSetValue(activeSet.id, 'reps', value);
                          }}
                        />
                        <MetricInput
                          kind="weight"
                          label={t('weightKg')}
                          placeholder={setState.getWeightPlaceholder(
                            isExtraSet(activeSet.setNumber, prescription.targetSets),
                          )}
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
              shouldOfferAddSet(currentExercise) && (
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
