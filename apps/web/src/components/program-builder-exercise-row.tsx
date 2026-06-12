'use client';

import { Button } from '@onemore/ui';

import { MetricInput } from '@/components/metric-input';
import { formatProgramExerciseSummary } from '@/lib/program-exercise-display';

import type { BuilderExercise } from './program-builder';

interface ProgramBuilderExerciseRowProps {
  exercise: BuilderExercise;
  isEditing: boolean;
  labels: {
    failureReps: string;
    editExercise: string;
    removeExercise: string;
    doneEditing: string;
    targetSets: string;
    targetReps: string;
    targetWeight: string;
    restSeconds: string;
  };
  onEdit: () => void;
  onDone: () => void;
  onRemove: () => void;
  onUpdate: (
    field: keyof BuilderExercise,
    value: string | number | null | BuilderExercise['primaryMuscles'],
  ) => void;
}

/**
 * Single exercise row in the program builder: compact view or inline edit mode.
 */
export function ProgramBuilderExerciseRow({
  exercise,
  isEditing,
  labels,
  onEdit,
  onDone,
  onRemove,
  onUpdate,
}: ProgramBuilderExerciseRowProps): React.ReactElement {
  if (!isEditing) {
    return (
      <li className="rounded-xl border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{exercise.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatProgramExerciseSummary(
                exercise.targetSets,
                exercise.targetReps,
                exercise.targetWeightKg,
                exercise.restSeconds,
                labels.failureReps,
              )}
            </p>
          </div>
          <button
            aria-label={labels.editExercise}
            className="rounded-md border p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            type="button"
            onClick={onEdit}
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
      </li>
    );
  }

  return (
    <li className="rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{exercise.name}</p>
        <button
          className="text-xs text-destructive"
          type="button"
          onClick={onRemove}
        >
          {labels.removeExercise}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <MetricInput
          kind="sets"
          label=""
          showLabel={false}
          value={exercise.targetSets}
          onChange={(value) => {
            onUpdate('targetSets', value ?? 1);
          }}
        />
        <MetricInput
          failureLabel={labels.failureReps}
          kind="repsPrescription"
          label={labels.targetReps}
          showLabel={false}
          value={exercise.targetReps}
          onChange={(value) => {
            onUpdate('targetReps', value ?? 8);
          }}
        />
        <MetricInput
          kind="weight"
          label={labels.targetWeight}
          showLabel={false}
          value={exercise.targetWeightKg}
          onChange={(value) => {
            onUpdate('targetWeightKg', value);
          }}
        />
        <MetricInput
          kind="rest"
          label={labels.restSeconds}
          showLabel={false}
          value={exercise.restSeconds}
          onChange={(value) => {
            onUpdate('restSeconds', value ?? 0);
          }}
        />
      </div>
      <Button className="mt-3 w-full" size="sm" type="button" variant="outline" onClick={onDone}>
        {labels.doneEditing}
      </Button>
    </li>
  );
}
