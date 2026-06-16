'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { Home } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

import { ExerciseNotesModal } from '@/components/exercise-notes-modal';
import { ExerciseSearchCombobox } from '@/components/exercise-search-combobox';
import { PrCelebration } from '@/components/pr-celebration';
import { CardioRestTimer } from '@/components/workout/cardio-rest-timer';
import { useHorizontalSwipe } from '@/hooks/use-horizontal-swipe';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { canCompleteWorkoutSet } from '@/lib/can-complete-workout-set';
import { getExerciseDisplayName } from '@/lib/exercise-display-name';
import { formatRelativeDaysAgo } from '@/lib/format-relative-days';
import { formatWorkoutDuration, getWorkoutElapsedSeconds } from '@/lib/format-workout-duration';
import { triggerHaptic } from '@/lib/haptic';
import { shouldOfferAddSet } from '@/lib/workout-completion';
import { formatLastExecutionLine } from '@/lib/workout-set-display';
import type { RestTimerContext, WorkoutExerciseDetail } from '@/lib/workout-exercise-set-state';
import type { SetPerformanceFeedback } from '@/lib/performance-feedback';

import { GymExerciseSets } from './gym-exercise-sets';
import { GymExerciseProgress } from './gym-exercise-progress';
import { GymWorkoutMenu } from './gym-workout-menu';

export interface GymActiveWorkoutViewProps {
  session: WorkoutSessionDetail;
  locale: string;
  accessToken: string | null;
  currentExercise: WorkoutExerciseDetail | null;
  exerciseIndex: number;
  restTimerContext: RestTimerContext | null;
  performanceFeedbackBySetId: Record<string, SetPerformanceFeedback>;
  actualRestBySetId: Record<string, number>;
  loading: boolean;
  syncingSetId?: string | null;
  error: string | null;
  notesModalOpen: boolean;
  notesSaving: boolean;
  newPrs: PersonalRecordSummary[];
  exerciseProgressText: string;
  formatSetLabel: (setNumber: number) => string;
  labels: {
    freeWorkoutTitle: string;
    restLabel: string;
    nextSet: string;
    searchExercises: string;
    searchNoResults: string;
    searchingExercises: string;
    addExercise: string;
    exerciseSkipped: string;
    setSkippedLabel: string;
    reps: string;
    weightKg: string;
    completeSetGym: string;
    addSet: string;
    addSetPrompt: string;
    exerciseActionsMenu: string;
    menuNotes: string;
    skipExercise: string;
    skipSet: string;
    finishWorkout: string;
    abandon: string;
    abandonConfirm: string;
    notesPlaceholder: string;
    notesModalTitle: string;
    saveNotes: string;
    cancel: string;
    editNotes: string;
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
    rirLabel: string;
    prevExercise: string;
    nextExercise: string;
    swipeHint: string;
    elapsedLabel: string;
    homeLabel: string;
    previousSetLabel: string;
    lastExecutionLabel: string;
    lastExecutionToday: string;
    lastExecutionYesterday: string;
    formatDaysAgo: (count: number) => string;
  };
  onRestComplete: (setId: string, actualRestSeconds: number) => void;
  onSelectExerciseToAdd: (exerciseLibraryId: string) => void;
  onCompleteSet: (setId: string, setNumber: number) => void;
  onSkipSet: (setId: string, setNumber: number) => void;
  onUpdateSetValue: (
    setId: string,
    field: 'weightKg' | 'reps' | 'rir',
    value: number | null,
  ) => void;
  onAddSet: () => void;
  onSkipExercise: () => void;
  onOpenNotes: () => void;
  onFinishWorkout: () => void;
  onAbandon: () => void;
  onExitWorkout: () => void;
  onExerciseIndexChange: (index: number) => void;
  onNotesModalClose: () => void;
  onNotesSave: (notes: string) => void;
  onDismissPr: () => void;
}

const exercisePanelTransition = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 72 : -72,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -48 : 48,
    opacity: 0,
    filter: 'blur(2px)',
  }),
};

/**
 * Mobile gym layout for an active workout: one exercise focus, large inputs, full-screen rest.
 */
export function GymActiveWorkoutView({
  session,
  locale,
  accessToken,
  currentExercise,
  exerciseIndex,
  restTimerContext,
  performanceFeedbackBySetId,
  actualRestBySetId,
  loading,
  syncingSetId = null,
  error,
  notesModalOpen,
  notesSaving,
  newPrs,
  exerciseProgressText: _exerciseProgressText,
  formatSetLabel,
  labels,
  onRestComplete,
  onSelectExerciseToAdd,
  onCompleteSet,
  onSkipSet,
  onUpdateSetValue,
  onAddSet,
  onSkipExercise,
  onOpenNotes,
  onFinishWorkout,
  onAbandon,
  onExitWorkout,
  onExerciseIndexChange,
  onNotesModalClose,
  onNotesSave,
  onDismissPr,
}: GymActiveWorkoutViewProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const [transitionDirection, setTransitionDirection] = useState(0);
  const [showLastExecution, setShowLastExecution] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    getWorkoutElapsedSeconds(session.startedAt),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(getWorkoutElapsedSeconds(session.startedAt));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [session.startedAt]);
  const motionTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };
  const exerciseMotionTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 360, damping: 34, mass: 0.85 };

  const navigateExercise = useCallback(
    (nextIndex: number): void => {
      if (nextIndex === exerciseIndex) {
        return;
      }
      if (nextIndex < 0 || nextIndex >= session.exercises.length) {
        return;
      }
      setTransitionDirection(nextIndex > exerciseIndex ? 1 : -1);
      triggerHaptic('light');
      onExerciseIndexChange(nextIndex);
    },
    [exerciseIndex, onExerciseIndexChange, session.exercises.length],
  );

  const swipeHandlers = useHorizontalSwipe({
    enabled: syncingSetId === null && restTimerContext === null,
    onSwipe: (direction) => {
      if (direction === 'left') {
        navigateExercise(exerciseIndex + 1);
      } else {
        navigateExercise(exerciseIndex - 1);
      }
    },
  });

  function handleCompleteSet(setId: string, setNumber: number): void {
    const activeSet = currentExercise?.sets.find((set) => set.id === setId);
    if (!activeSet || !canCompleteWorkoutSet(activeSet.reps)) {
      return;
    }
    triggerHaptic('success');
    onCompleteSet(setId, setNumber);
  }

  function handleRestComplete(setId: string, actualRestSeconds: number): void {
    triggerHaptic('success');
    onRestComplete(setId, actualRestSeconds);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AnimatePresence mode="wait">
        {restTimerContext !== null ? (
          <motion.div
            key="rest"
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]"
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
            initial={reducedMotion ? undefined : { opacity: 0, scale: 1.02 }}
            transition={motionTransition}
          >
            {newPrs.length > 0 ? (
              <PrCelebration records={newPrs} variant="gym" onDismiss={onDismissPr} />
            ) : null}
            <CardioRestTimer
              compact
              locale={locale}
              nextSetLabel={labels.nextSet}
              rpe={restTimerContext.rpe}
              seconds={restTimerContext.seconds}
              onNextSet={(actualRestSeconds) => {
                handleRestComplete(restTimerContext.setId, actualRestSeconds);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workout"
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-dvh flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
            initial={reducedMotion ? undefined : { opacity: 0, scale: 1.01 }}
            transition={motionTransition}
            {...swipeHandlers}
          >
            <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:bg-gym-surface/90">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {session.workoutDayLabel ?? labels.freeWorkoutTitle}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground/80">
                    {labels.elapsedLabel}: {formatWorkoutDuration(elapsedSeconds)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    aria-label={labels.homeLabel}
                    className="min-h-11 min-w-11 px-0"
                    disabled={syncingSetId !== null}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onExitWorkout();
                    }}
                  >
                    <Home aria-hidden className="h-5 w-5" />
                  </Button>
                  {currentExercise ? (
                    <GymWorkoutMenu
                      disabled={syncingSetId !== null}
                      labels={{
                        menu: labels.exerciseActionsMenu,
                        notes: labels.menuNotes,
                        skipExercise: labels.skipExercise,
                        finishWorkout: labels.finishWorkout,
                        abandon: labels.abandon,
                        abandonConfirm: labels.abandonConfirm,
                        addSet: labels.addSet,
                        cancel: labels.cancel,
                      }}
                      showAddSet={shouldOfferAddSet(currentExercise)}
                      showSkipExercise={currentExercise.status !== 'skipped'}
                      onAbandon={onAbandon}
                      onAddSet={onAddSet}
                      onFinishWorkout={onFinishWorkout}
                      onNotes={onOpenNotes}
                      onSkipExercise={onSkipExercise}
                    />
                  ) : null}
                </div>
              </div>

              {currentExercise && (
                <>
                  <div className="mt-2 flex items-start gap-2">
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={currentExercise.id}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-w-0 flex-1 text-2xl font-bold leading-tight"
                        exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                        transition={motionTransition}
                      >
                        {getExerciseDisplayName(currentExercise.exercise, locale)}
                      </motion.h1>
                    </AnimatePresence>
                  </div>

                  {currentExercise.status !== 'skipped' && currentExercise.previousExecution ? (
                    <div className="mt-2">
                      <button
                        className="text-xs font-medium text-primary"
                        type="button"
                        onClick={() => {
                          setShowLastExecution((value) => !value);
                        }}
                      >
                        {labels.lastExecutionLabel}
                        {showLastExecution ? ' ▴' : ' ▾'}
                      </button>
                      {showLastExecution ? (
                        <div className="mt-1 rounded-xl border border-foreground/15 bg-muted/30 px-3 py-2 text-sm">
                          <p className="text-foreground">
                            {formatLastExecutionLine(
                              currentExercise.previousExecution.setsCount,
                              currentExercise.previousExecution.reps,
                              currentExercise.previousExecution.weightKg,
                              labels.failureReps,
                            )}
                            {currentExercise.previousExecution.completedAt ? (
                              <span className="text-muted-foreground">
                                {' '}
                                ·{' '}
                                {formatRelativeDaysAgo(
                                  currentExercise.previousExecution.completedAt,
                                  locale,
                                  {
                                    today: labels.lastExecutionToday,
                                    yesterday: labels.lastExecutionYesterday,
                                    daysAgo: labels.formatDaysAgo,
                                  },
                                )}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <GymExerciseProgress
                    completedIndexes={session.exercises
                      .map((exercise, index) => (exercise.status === 'completed' ? index : -1))
                      .filter((index) => index >= 0)}
                    currentIndex={exerciseIndex}
                    skippedIndexes={session.exercises
                      .map((exercise, index) => (exercise.status === 'skipped' ? index : -1))
                      .filter((index) => index >= 0)}
                    total={session.exercises.length}
                    onSelectIndex={navigateExercise}
                  />
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    {labels.swipeHint}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <Button
                      aria-label={labels.prevExercise}
                      className="min-h-11 min-w-11 px-0"
                      disabled={exerciseIndex === 0 || syncingSetId !== null}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigateExercise(exerciseIndex - 1);
                      }}
                    >
                      ‹
                    </Button>
                    <Button
                      aria-label={labels.nextExercise}
                      className="min-h-10 min-w-10 px-0"
                      disabled={
                        exerciseIndex >= session.exercises.length - 1 || syncingSetId !== null
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigateExercise(exerciseIndex + 1);
                      }}
                    >
                      ›
                    </Button>
                  </div>
                </>
              )}
            </header>

            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              {session.sessionType === 'free' && accessToken && session.exercises.length === 0 && (
                <ExerciseSearchCombobox
                  accessToken={accessToken}
                  disabled={loading}
                  locale={locale}
                  noResultsLabel={labels.searchNoResults}
                  placeholder={labels.searchExercises}
                  searchingLabel={labels.searchingExercises}
                  showMuscleFilter={false}
                  onSelect={(exercise) => {
                    onSelectExerciseToAdd(exercise.id);
                  }}
                />
              )}

              {currentExercise && (
                <>
                  {currentExercise.status === 'skipped' && (
                    <p className="text-sm text-muted-foreground">{labels.exerciseSkipped}</p>
                  )}

                  {currentExercise.status !== 'skipped' && (
                    <AnimatePresence custom={transitionDirection} mode="wait">
                      <motion.div
                        key={currentExercise.id}
                        animate="center"
                        custom={transitionDirection}
                        exit="exit"
                        initial="enter"
                        transition={exerciseMotionTransition}
                        variants={reducedMotion ? undefined : exercisePanelTransition}
                      >
                        <GymExerciseSets
                          actualRestBySetId={actualRestBySetId}
                          exercise={currentExercise}
                          formatSetLabel={formatSetLabel}
                          labels={{
                            setSkippedLabel: labels.setSkippedLabel,
                            skipSet: labels.skipSet,
                            reps: labels.reps,
                            weightKg: labels.weightKg,
                            placeholderReps: labels.placeholderReps,
                            placeholderWeight: labels.placeholderWeight,
                            failureReps: labels.failureReps,
                            rirLabel: labels.rirLabel,
                          }}
                          loading={loading}
                          syncingSetId={syncingSetId}
                          performanceFeedbackBySetId={performanceFeedbackBySetId}
                          restTimerContext={restTimerContext}
                          onSkipSet={onSkipSet}
                          onUpdateSetValue={onUpdateSetValue}
                        />
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {currentExercise.athleteNotes && (
                    <button
                      className="rounded-lg bg-muted/30 px-3 py-2 text-left text-sm italic text-muted-foreground"
                      type="button"
                      onClick={onOpenNotes}
                    >
                      {currentExercise.athleteNotes}
                    </button>
                  )}

                  <ExerciseNotesModal
                    cancelLabel={labels.cancel}
                    initialValue={currentExercise.athleteNotes ?? ''}
                    open={notesModalOpen}
                    placeholder={labels.notesPlaceholder}
                    saveLabel={labels.saveNotes}
                    saving={notesSaving}
                    title={labels.notesModalTitle}
                    onClose={onNotesModalClose}
                    onSave={onNotesSave}
                  />
                </>
              )}

              {session.sessionType === 'free' && accessToken && session.exercises.length > 0 && (
                <div className="flex flex-col gap-2" data-no-swipe>
                  <p className="text-sm font-medium">{labels.addExercise}</p>
                  <ExerciseSearchCombobox
                    accessToken={accessToken}
                    disabled={syncingSetId !== null}
                    locale={locale}
                    noResultsLabel={labels.searchNoResults}
                    placeholder={labels.searchExercises}
                    searchingLabel={labels.searchingExercises}
                    showMuscleFilter={false}
                    onSelect={(exercise) => {
                      onSelectExerciseToAdd(exercise.id);
                    }}
                  />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <AnimatePresence mode="wait">
              {currentExercise &&
                currentExercise.status !== 'skipped' &&
                (() => {
                  const activeSet = currentExercise.sets.find(
                    (set) => !set.isCompleted && !set.isSkipped,
                  );
                  if (activeSet) {
                    return (
                      <motion.div
                        key={`complete-${activeSet.id}`}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[max(1rem,env(safe-area-inset-bottom))]"
                        exit={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                        transition={motionTransition}
                      >
                        <Button
                          className="min-h-14 w-full text-lg font-semibold"
                          disabled={
                            syncingSetId === activeSet.id || !canCompleteWorkoutSet(activeSet.reps)
                          }
                          type="button"
                          onClick={() => {
                            handleCompleteSet(activeSet.id, activeSet.setNumber);
                          }}
                        >
                          {labels.completeSetGym}
                        </Button>
                      </motion.div>
                    );
                  }

                  const allSetsDone = currentExercise.sets.every(
                    (set) => set.isCompleted || set.isSkipped,
                  );
                  if (!allSetsDone || !shouldOfferAddSet(currentExercise)) {
                    return null;
                  }

                  return (
                    <motion.div
                      key="add-set"
                      animate={{ opacity: 1, y: 0 }}
                      className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[max(1rem,env(safe-area-inset-bottom))]"
                      exit={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                      transition={motionTransition}
                    >
                      <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
                        {labels.addSetPrompt}
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          className="min-h-14 w-full text-lg font-semibold"
                          disabled={loading}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            onFinishWorkout();
                          }}
                        >
                          {labels.finishWorkout}
                        </Button>
                        <Button
                          className="min-h-12 w-full"
                          disabled={loading}
                          type="button"
                          variant="outline"
                          onClick={() => {
                            triggerHaptic('light');
                            onAddSet();
                          }}
                        >
                          {labels.addSet}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
