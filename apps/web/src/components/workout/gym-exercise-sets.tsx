'use client';

import { AnimatePresence, motion } from 'motion/react';

import { GymCompletedCheck } from '@/components/gym-ui/gym-completed-check';
import { Button } from '@onemore/ui';
import { NumberStepper } from '@/components/number-stepper';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  buildExerciseSetViewState,
  isExtraSet,
  resolveDefaultReps,
  resolveDefaultWeightKg,
  type RestTimerContext,
  type WorkoutExerciseDetail,
} from '@/lib/workout-exercise-set-state';
import {
  formatLoggedSetLine,
  formatSetPrescriptionLine,
  formatSetTargetInline,
} from '@/lib/workout-set-display';
import { SetPerformanceBadge } from '@/components/workout/set-performance-badge';
import { RirSelector } from '@/components/workout/rir-selector';
import type { SetPerformanceFeedback } from '@/lib/performance-feedback';

interface GymExerciseSetsProps {
  exercise: WorkoutExerciseDetail;
  restTimerContext: RestTimerContext | null;
  performanceFeedbackBySetId: Record<string, SetPerformanceFeedback>;
  actualRestBySetId: Record<string, number>;
  loading: boolean;
  syncingSetId?: string | null;
  labels: {
    setSkippedLabel: string;
    skipSet: string;
    reps: string;
    weightKg: string;
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
    rirLabel: string;
  };
  formatSetLabel: (setNumber: number) => string;
  onSkipSet: (setId: string, setNumber: number) => void;
  onUpdateSetValue: (
    setId: string,
    field: 'weightKg' | 'reps' | 'rir',
    value: number | null,
  ) => void;
}

const activeSetTransition = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -14, scale: 0.97 },
};

/**
 * Animated set list and active-set inputs for the gym workout screen.
 */
export function GymExerciseSets({
  exercise,
  restTimerContext,
  performanceFeedbackBySetId,
  actualRestBySetId,
  loading: _loading,
  syncingSetId = null,
  labels,
  formatSetLabel,
  onSkipSet,
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
  const motionTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.75 };
  const fieldLabels = {
    placeholderReps: labels.placeholderReps,
    placeholderWeight: labels.placeholderWeight,
    failureReps: labels.failureReps,
  };
  const activeSet = setState.activeSet;
  const activeReps =
    activeSet?.reps ?? (activeSet ? resolveDefaultReps(exercise, activeSet, fieldLabels) : null);
  const activeWeight =
    activeSet?.weightKg ??
    (activeSet ? resolveDefaultWeightKg(exercise, activeSet, fieldLabels) : null);
  const weightWheelCenter = activeWeight ?? activeSet?.weightKg ?? 60;
  const inputsDisabled = syncingSetId !== null;

  return (
    <div className="flex flex-col gap-4">
      {setState.completedSets.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {setState.completedSets.map((set) => {
            const feedback = performanceFeedbackBySetId[set.id];
            return (
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
                  <>
                    {feedback ? <SetPerformanceBadge feedback={feedback} /> : null}
                    <span className="ml-auto text-muted-foreground">
                      {formatLoggedSetLine(
                        set.reps,
                        set.weightKg,
                        setState.getDisplayedRestSeconds(set.id),
                        prescription.targetReps,
                      )}
                    </span>
                  </>
                )}
              </div>
            );
          })}
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
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-lg font-semibold">
                {formatSetLabel(setState.activeSet.setNumber)}
              </p>
              {!isExtraSet(setState.activeSet.setNumber, prescription.targetSets) ? (
                <p className="text-sm font-semibold text-primary">
                  {formatSetTargetInline(
                    prescription.targetSets,
                    prescription.targetReps,
                    prescription.targetWeightKg,
                    prescription.restSeconds,
                    labels.failureReps,
                    { weightPrescriptionMode: prescription.weightPrescriptionMode, targetPercentOfMax: prescription.targetPercentOfMax },
                  )}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <NumberStepper
                disabled={inputsDisabled}
                kind="reps"
                label={labels.reps}
                placeholder={setState.getRepsPlaceholder(
                  isExtraSet(setState.activeSet.setNumber, prescription.targetSets),
                )}
                size="gym"
                step={1}
                value={activeReps}
                onChange={(value) => {
                  const currentActiveSet = setState.activeSet;
                  if (!currentActiveSet) {
                    return;
                  }
                  onUpdateSetValue(currentActiveSet.id, 'reps', value);
                }}
              />
              {!exercise.exercise.isBodyweight ? (
                <NumberStepper
                  disabled={inputsDisabled}
                  kind="weight"
                  label={labels.weightKg}
                  placeholder={setState.getWeightPlaceholder(
                    isExtraSet(setState.activeSet.setNumber, prescription.targetSets),
                  )}
                  size="gym"
                  step={0.5}
                  value={activeWeight}
                  wheelCenterKg={weightWheelCenter}
                  onChange={(value) => {
                    const currentActiveSet = setState.activeSet;
                    if (!currentActiveSet) {
                      return;
                    }
                    onUpdateSetValue(currentActiveSet.id, 'weightKg', value);
                  }}
                />
              ) : null}
            </div>

            {!setState.activeSet.isWarmup ? (
              <div className="mt-4">
                <RirSelector
                  disabled={inputsDisabled}
                  label={labels.rirLabel}
                  value={setState.activeSet.rir}
                  onChange={(rir) => {
                    const currentActiveSet = setState.activeSet;
                    if (!currentActiveSet) {
                      return;
                    }
                    onUpdateSetValue(currentActiveSet.id, 'rir', rir);
                  }}
                />
              </div>
            ) : null}

            <Button
              className="mt-4 min-h-11 w-full text-sm"
              disabled={inputsDisabled}
              type="button"
              variant="outline"
              onClick={() => {
                const currentActiveSet = setState.activeSet;
                if (!currentActiveSet) {
                  return;
                }
                onSkipSet(currentActiveSet.id, currentActiveSet.setNumber);
              }}
            >
              {labels.skipSet}
            </Button>
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
                    { weightPrescriptionMode: prescription.weightPrescriptionMode, targetPercentOfMax: prescription.targetPercentOfMax },
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
