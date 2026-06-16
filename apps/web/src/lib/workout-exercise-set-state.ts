import { formatTargetRepsLabel, type WorkoutSessionDetail } from '@onemore/shared';

import { formatPrescribedWeight, isExtraSet } from './workout-set-display';

export type WorkoutExerciseDetail = WorkoutSessionDetail['exercises'][number];
export type WorkoutSetDetail = WorkoutExerciseDetail['sets'][number];

export interface RestTimerContext {
  setId: string;
  seconds: number;
  rpe?: number | null;
}

export interface ExerciseSetViewState {
  isResting: boolean;
  activeSet: WorkoutSetDetail | null;
  completedSets: WorkoutSetDetail[];
  futureSets: WorkoutSetDetail[];
  getRepsPlaceholder: (forExtraSet: boolean) => string;
  getWeightPlaceholder: (forExtraSet: boolean) => string;
  getDisplayedRestSeconds: (setId: string) => number | null;
}

export interface BuildExerciseSetViewStateInput {
  exercise: WorkoutExerciseDetail;
  restTimerContext: RestTimerContext | null;
  actualRestBySetId: Record<string, number>;
  labels: {
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
  };
}

/**
 * Derives active/completed/future sets and placeholder helpers for workout UIs.
 */
export function buildExerciseSetViewState({
  exercise,
  restTimerContext,
  actualRestBySetId,
  labels,
}: BuildExerciseSetViewStateInput): ExerciseSetViewState {
  const { prescription } = exercise;
  const isResting = restTimerContext !== null;
  const activeSet = isResting
    ? null
    : (exercise.sets.find((item) => !item.isCompleted && !item.isSkipped) ?? null);
  const previousWeight = exercise.previousSet?.weightKg;
  const previousReps = exercise.previousSet?.reps;
  const lastLoggedSet = [...exercise.sets]
    .filter((item) => item.isCompleted && !item.isSkipped)
    .sort((a, b) => b.setNumber - a.setNumber)[0];
  const lastSetInExercise = [...exercise.sets].sort((a, b) => b.setNumber - a.setNumber)[0];
  const extraPlaceholderSource = lastLoggedSet ?? lastSetInExercise;

  function getRepsPlaceholder(forExtraSet: boolean): string {
    if (forExtraSet) {
      if (extraPlaceholderSource?.reps !== null && extraPlaceholderSource?.reps !== undefined) {
        return String(extraPlaceholderSource.reps);
      }
      return labels.placeholderReps;
    }
    if (previousReps !== null && previousReps !== undefined) {
      return String(previousReps);
    }
    return formatTargetRepsLabel(prescription.targetReps, labels.failureReps);
  }

  function getWeightPlaceholder(forExtraSet: boolean): string {
    if (forExtraSet) {
      if (
        extraPlaceholderSource?.weightKg !== null &&
        extraPlaceholderSource?.weightKg !== undefined
      ) {
        return String(extraPlaceholderSource.weightKg);
      }
      return labels.placeholderWeight;
    }
    if (previousWeight !== null && previousWeight !== undefined) {
      return String(previousWeight);
    }
    return formatPrescribedWeight(prescription.targetWeightKg) === '—'
      ? labels.placeholderWeight
      : formatPrescribedWeight(prescription.targetWeightKg);
  }

  const completedSets = exercise.sets.filter((item) => item.isCompleted || item.isSkipped);
  const futureSets = isResting
    ? exercise.sets.filter((item) => !item.isCompleted && !item.isSkipped)
    : activeSet
      ? exercise.sets.filter(
          (item) => !item.isCompleted && !item.isSkipped && item.id !== activeSet.id,
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

  return {
    isResting,
    activeSet,
    completedSets,
    futureSets,
    getRepsPlaceholder,
    getWeightPlaceholder,
    getDisplayedRestSeconds,
  };
}

/**
 * Numeric default reps for the active set when the athlete has not edited the field yet.
 */
export function resolveDefaultReps(
  exercise: WorkoutExerciseDetail,
  set: WorkoutSetDetail,
  labels: {
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
  },
): number | null {
  const viewState = buildExerciseSetViewState({
    exercise,
    restTimerContext: null,
    actualRestBySetId: {},
    labels,
  });
  const placeholder = viewState.getRepsPlaceholder(
    isExtraSet(set.setNumber, exercise.prescription.targetSets),
  );
  const parsed = Number(placeholder);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed;
  }
  const target = exercise.prescription.targetReps;
  if (target > 0) {
    return target;
  }
  return null;
}

/**
 * Numeric default weight (kg) for the active set when not yet edited.
 */
export function resolveDefaultWeightKg(
  exercise: WorkoutExerciseDetail,
  set: WorkoutSetDetail,
  labels: {
    placeholderReps: string;
    placeholderWeight: string;
    failureReps: string;
  },
): number | null {
  if (exercise.exercise.isBodyweight) {
    return null;
  }
  const viewState = buildExerciseSetViewState({
    exercise,
    restTimerContext: null,
    actualRestBySetId: {},
    labels,
  });
  const placeholder = viewState.getWeightPlaceholder(
    isExtraSet(set.setNumber, exercise.prescription.targetSets),
  );
  const parsed = Number(placeholder);
  if (!Number.isNaN(parsed) && parsed >= 0) {
    return parsed;
  }
  return exercise.prescription.targetWeightKg ?? null;
}

export { isExtraSet };
