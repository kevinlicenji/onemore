'use client';

import { AnimatePresence, motion } from 'motion/react';

import { GymCompletedCheck } from '@/components/gym-ui/gym-completed-check';
import { cn } from '@onemore/ui';
import { NumberStepper } from '@/components/number-stepper';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  buildExerciseSetViewState,
  isExtraSet,
  type RestTimerContext,
  type WorkoutExerciseDetail,
} from '@/lib/workout-exercise-set-state';
import {
  formatLoggedSetLine,
  formatPreviousSetLine,
  formatSetPrescriptionLine,
} from '@/lib/workout-set-display';

interface GymExerciseSetsProps {
  exercise: WorkoutExerciseDetail;
  restTimerContext: RestTimerContext | null;
  actualRestBySetId: Record<string, number>;
  loading: boolean;
  labels: {
    setSkippedLabel: string;
    reps: string;
    weightKg: string;
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
    previousSetLabel: string;
  };
  formatSetLabel: (setNumber: number) => string;
  formatSetProgress: (current: number, total: number) => string;
  onUpdateSetValue: (setId: string, field: 'weightKg' | 'reps', value: number | null) => void;
}

const activeSetTransition = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

/**
 * Animated set list and active-set inputs for the gym workout screen.
 */
export function GymExerciseSets({
  exercise,
  restTimerContext,
  actualRestBySetId,
  loading,
  labels,
  formatSetLabel,
  formatSetProgress,
  onUpdateSetValue,
}: GymExerciseSetsProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const setState = buildExerciseSetViewState({
    exercise,
    restTimerContext,
    actualRestBySetId,
    labels: {
      placeholderReps: labels.placeholderReps,
      placeholderWeight: labels.placeholderWeight,
      failureReps: labels.failureReps,
    },
  });
  const { prescription } = exercise;
  const previousSetLine = formatPreviousSetLine(
    exercise.previousSet?.weightKg ?? null,
    exercise.previousSet?.reps ?? null,
    labels.failureReps,
  );
  const totalSets = exercise.sets.length;
  const completedCount = setState.completedSets.length;
  const motionTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const };

  return (
    <div className="flex flex-col gap-4">
      {setState.completedSets.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {setState.completedSets.map((set) => (
            <div
              key={set.id}
              className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
            >
              {set.isCompleted ? (
                <GymCompletedCheck />
              ) : (
                <span className="h-4 w-4 shrink-0 text-muted-foreground">—</span>
              )}
              <span className="font-medium">{formatSetLabel(set.setNumber)}</span>
              {set.isSkipped ? (
                <span className="sr-only">{labels.setSkippedLabel}</span>
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
        </div>
      )}

      <AnimatePresence mode="wait">
        {setState.activeSet && (
          <motion.div
            key={setState.activeSet.id}
            animate={reducedMotion ? undefined : activeSetTransition.animate}
            className="rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-sm"
            exit={reducedMotion ? undefined : activeSetTransition.exit}
            initial={reducedMotion ? undefined : activeSetTransition.initial}
            transition={motionTransition}
          >
            {previousSetLine ? (
              <p className="mb-3 rounded-xl bg-gym-tint/80 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{labels.previousSetLabel}</span>
                {' · '}
                {previousSetLine}
              </p>
            ) : null}
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-lg font-semibold">
                {formatSetLabel(setState.activeSet.setNumber)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatSetProgress(completedCount + 1, totalSets)}
              </p>
            </div>
            {!isExtraSet(setState.activeSet.setNumber, prescription.targetSets) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatSetPrescriptionLine(
                  prescription.targetReps,
                  prescription.targetWeightKg,
                  prescription.restSeconds,
                  labels.failureReps,
                )}
              </p>
            )}

            <div
              className={cn(
                'mt-4 grid gap-3',
                exercise.exercise.isBodyweight ? 'grid-cols-1' : 'grid-cols-2',
              )}
            >
              <NumberStepper
                disabled={loading}
                kind="reps"
                label={labels.reps}
                placeholder={setState.getRepsPlaceholder(
                  isExtraSet(setState.activeSet.setNumber, prescription.targetSets),
                )}
                size="gym"
                step={1}
                value={setState.activeSet.reps}
                onChange={(value) => {
                  const activeSet = setState.activeSet;
                  if (!activeSet) {
                    return;
                  }
                  onUpdateSetValue(activeSet.id, 'reps', value);
                }}
              />
              {!exercise.exercise.isBodyweight ? (
                <NumberStepper
                  disabled={loading}
                  kind="weight"
                  label={labels.weightKg}
                  placeholder={setState.getWeightPlaceholder(
                    isExtraSet(setState.activeSet.setNumber, prescription.targetSets),
                  )}
                  size="gym"
                  step={0.5}
                  value={setState.activeSet.weightKg}
                  onChange={(value) => {
                    const activeSet = setState.activeSet;
                    if (!activeSet) {
                      return;
                    }
                    onUpdateSetValue(activeSet.id, 'weightKg', value);
                  }}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {setState.futureSets.length > 0 && (
        <div className="flex flex-col gap-1.5 opacity-60">
          {setState.futureSets.map((set) => (
            <div
              key={set.id}
              className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground"
            >
              {formatSetLabel(set.setNumber)}
              {!isExtraSet(set.setNumber, prescription.targetSets) && (
                <span className="ml-2">
                  {formatSetPrescriptionLine(
                    prescription.targetReps,
                    prescription.targetWeightKg,
                    prescription.restSeconds,
                    labels.failureReps,
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
