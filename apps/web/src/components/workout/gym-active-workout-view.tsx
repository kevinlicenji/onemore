'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button, cn } from '@onemore/ui';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

import { ExerciseNotesModal } from '@/components/exercise-notes-modal';
import { ExerciseSearchCombobox } from '@/components/exercise-search-combobox';
import { RestTimer } from '@/components/rest-timer';
import { useHorizontalSwipe } from '@/hooks/use-horizontal-swipe';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { getExerciseDisplayName } from '@/lib/exercise-display-name';
import { formatWorkoutDuration, getWorkoutElapsedSeconds } from '@/lib/format-workout-duration';
import { triggerHaptic } from '@/lib/haptic';
import type { RestTimerContext, WorkoutExerciseDetail } from '@/lib/workout-exercise-set-state';

import { GymExerciseSets } from './gym-exercise-sets';
import { GymWorkoutMenu } from './gym-workout-menu';

export interface GymActiveWorkoutViewProps {
  session: WorkoutSessionDetail;
  locale: string;
  accessToken: string | null;
  currentExercise: WorkoutExerciseDetail | null;
  exerciseIndex: number;
  restTimerContext: RestTimerContext | null;
  actualRestBySetId: Record<string, number>;
  loading: boolean;
  error: string | null;
  substituteMode: boolean;
  notesModalOpen: boolean;
  notesSaving: boolean;
  exerciseProgressText: string;
  formatSetLabel: (setNumber: number) => string;
  formatSetProgress: (current: number, total: number) => string;
  labels: {
    freeWorkoutTitle: string;
    restLabel: string;
    nextSet: string;
    skipRest: string;
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
    exerciseActionsMenu: string;
    menuNotes: string;
    substituteExercise: string;
    skipExercise: string;
    skipSet: string;
    finishWorkout: string;
    abandon: string;
    notesPlaceholder: string;
    notesModalTitle: string;
    saveNotes: string;
    cancel: string;
    editNotes: string;
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
    prevExercise: string;
    nextExercise: string;
    swipeHint: string;
    elapsedLabel: string;
    previousSetLabel: string;
  };
  onRestComplete: (setId: string, actualRestSeconds: number) => void;
  onSkipRest: () => void;
  onSelectExerciseToAdd: (exerciseLibraryId: string) => void;
  onSelectSubstitute: (exerciseLibraryId: string) => void;
  onCompleteSet: (setId: string, setNumber: number) => void;
  onSkipSet: (setId: string, setNumber: number) => void;
  onUpdateSetValue: (setId: string, field: 'weightKg' | 'reps', value: number | null) => void;
  onAddSet: () => void;
  onSkipExercise: () => void;
  onOpenNotes: () => void;
  onOpenSubstitute: () => void;
  onFinishWorkout: () => void;
  onAbandon: () => void;
  onExerciseIndexChange: (index: number) => void;
  onNotesModalClose: () => void;
  onNotesSave: (notes: string) => void;
}

const exercisePanelTransition = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 56 : -56,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -56 : 56,
    opacity: 0,
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
  actualRestBySetId,
  loading,
  error,
  substituteMode,
  notesModalOpen,
  notesSaving,
  exerciseProgressText,
  formatSetLabel,
  formatSetProgress,
  labels,
  onRestComplete,
  onSkipRest,
  onSelectExerciseToAdd,
  onSelectSubstitute,
  onCompleteSet,
  onSkipSet,
  onUpdateSetValue,
  onAddSet,
  onSkipExercise,
  onOpenNotes,
  onOpenSubstitute,
  onFinishWorkout,
  onAbandon,
  onExerciseIndexChange,
  onNotesModalClose,
  onNotesSave,
}: GymActiveWorkoutViewProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const [transitionDirection, setTransitionDirection] = useState(0);
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
    : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

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
    enabled: !loading && !substituteMode && restTimerContext === null,
    onSwipe: (direction) => {
      if (direction === 'left') {
        navigateExercise(exerciseIndex + 1);
      } else {
        navigateExercise(exerciseIndex - 1);
      }
    },
  });

  function handleCompleteSet(setId: string, setNumber: number): void {
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
            animate={{ opacity: 1 }}
            className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]"
            exit={reducedMotion ? undefined : { opacity: 0 }}
            initial={reducedMotion ? undefined : { opacity: 0 }}
            transition={motionTransition}
          >
            <RestTimer
              label={labels.restLabel}
              nextSetLabel={labels.nextSet}
              seconds={restTimerContext.seconds}
              skipRestLabel={labels.skipRest}
              variant="gym"
              onNextSet={(actualRestSeconds) => {
                handleRestComplete(restTimerContext.setId, actualRestSeconds);
              }}
              onSkipRest={() => {
                triggerHaptic('light');
                onSkipRest();
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workout"
            animate={{ opacity: 1 }}
            className="flex min-h-dvh flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
            exit={reducedMotion ? undefined : { opacity: 0 }}
            initial={reducedMotion ? undefined : { opacity: 0 }}
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
                {currentExercise && currentExercise.status !== 'skipped' && (
                  <GymWorkoutMenu
                    disabled={loading}
                    labels={{
                      menu: labels.exerciseActionsMenu,
                      notes: labels.menuNotes,
                      substitute: labels.substituteExercise,
                      skipExercise: labels.skipExercise,
                      skipSet: labels.skipSet,
                      finishWorkout: labels.finishWorkout,
                      abandon: labels.abandon,
                      addSet: labels.addSet,
                    }}
                    showAddSet={
                      !currentExercise.sets.some((set) => !set.isCompleted && !set.isSkipped)
                    }
                    showSkipSet={Boolean(
                      currentExercise.sets.find((set) => !set.isCompleted && !set.isSkipped),
                    )}
                    showSubstitute={session.sessionType === 'programmed'}
                    onAbandon={onAbandon}
                    onAddSet={onAddSet}
                    onFinishWorkout={onFinishWorkout}
                    onNotes={onOpenNotes}
                    onSkipExercise={onSkipExercise}
                    onSkipSet={() => {
                      const activeSet = currentExercise.sets.find(
                        (set) => !set.isCompleted && !set.isSkipped,
                      );
                      if (activeSet) {
                        onSkipSet(activeSet.id, activeSet.setNumber);
                      }
                    }}
                    onSubstitute={onOpenSubstitute}
                  />
                )}
              </div>

              {currentExercise && (
                <>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    {getExerciseDisplayName(currentExercise.exercise, locale)}
                  </h1>
                  <div aria-hidden className="mt-3 flex items-center justify-center gap-1.5">
                    {session.exercises.map((exercise, index) => (
                      <span
                        key={exercise.id}
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          index === exerciseIndex
                            ? 'w-5 bg-primary'
                            : exercise.status === 'completed' || exercise.status === 'skipped'
                              ? 'w-1.5 bg-primary/35'
                              : 'w-1.5 bg-muted-foreground/25',
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{exerciseProgressText}</p>
                      <p className="text-[11px] text-muted-foreground/80">{labels.swipeHint}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        aria-label={labels.prevExercise}
                        className="min-h-10 min-w-10 px-0"
                        disabled={exerciseIndex === 0 || loading}
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
                        disabled={exerciseIndex >= session.exercises.length - 1 || loading}
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
                        transition={motionTransition}
                        variants={reducedMotion ? undefined : exercisePanelTransition}
                      >
                        <GymExerciseSets
                          actualRestBySetId={actualRestBySetId}
                          exercise={currentExercise}
                          formatSetLabel={formatSetLabel}
                          formatSetProgress={formatSetProgress}
                          labels={{
                            setSkippedLabel: labels.setSkippedLabel,
                            reps: labels.reps,
                            weightKg: labels.weightKg,
                            placeholderReps: labels.placeholderReps,
                            placeholderWeight: labels.placeholderWeight,
                            failureReps: labels.failureReps,
                            previousSetLabel: labels.previousSetLabel,
                          }}
                          loading={loading}
                          restTimerContext={restTimerContext}
                          onUpdateSetValue={onUpdateSetValue}
                        />
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {substituteMode && currentExercise.status !== 'skipped' && accessToken && (
                    <div className="rounded-xl border p-3" data-no-swipe>
                      <ExerciseSearchCombobox
                        accessToken={accessToken}
                        disabled={loading}
                        locale={locale}
                        noResultsLabel={labels.searchNoResults}
                        placeholder={labels.searchExercises}
                        searchingLabel={labels.searchingExercises}
                        onSelect={(exercise) => {
                          onSelectSubstitute(exercise.id);
                        }}
                      />
                    </div>
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
                    disabled={loading}
                    locale={locale}
                    noResultsLabel={labels.searchNoResults}
                    placeholder={labels.searchExercises}
                    searchingLabel={labels.searchingExercises}
                    onSelect={(exercise) => {
                      onSelectExerciseToAdd(exercise.id);
                    }}
                  />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {currentExercise &&
              currentExercise.status !== 'skipped' &&
              (() => {
                const activeSet = currentExercise.sets.find(
                  (set) => !set.isCompleted && !set.isSkipped,
                );
                if (!activeSet) {
                  return null;
                }
                return (
                  <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <Button
                      className="min-h-14 w-full text-lg font-semibold"
                      disabled={loading}
                      type="button"
                      onClick={() => {
                        handleCompleteSet(activeSet.id, activeSet.setNumber);
                      }}
                    >
                      {labels.completeSetGym}
                    </Button>
                  </div>
                );
              })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
