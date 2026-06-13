'use client';

import { Button } from '@onemore/ui';

import { useExerciseRowLongPressDrag } from '@/hooks/use-exercise-row-long-press-drag';
import { MetricInput } from '@/components/metric-input';
import { formatProgramExerciseSummary } from '@/lib/program-exercise-display';

import type { BuilderExercise } from './program-builder';

interface ProgramBuilderExerciseRowProps {
  exercise: BuilderExercise;
  exerciseIndex: number;
  isEditing: boolean;
  isDragging: boolean;
  labels: {
    failureReps: string;
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
  onDragStart: (exerciseIndex: number) => void;
  onDragEnter: (exerciseIndex: number) => void;
  onDragEnd: () => void;
  onUpdate: (
    field: keyof BuilderExercise,
    value: string | number | null | BuilderExercise['primaryMuscles'],
  ) => void;
}

/**
 * Single exercise row in the program builder: tap to edit, long-press to reorder.
 */
export function ProgramBuilderExerciseRow({
  exercise,
  exerciseIndex,
  isEditing,
  isDragging,
  labels,
  onEdit,
  onDone,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onUpdate,
}: ProgramBuilderExerciseRowProps): React.ReactElement {
  const { handlePointerDown } = useExerciseRowLongPressDrag({
    exerciseIndex,
    enabled: true,
    onDragEnd,
    onDragEnter,
    onDragStart,
    onTap: onEdit,
  });

  const rowClassName = `rounded-xl border px-3 py-3 transition-colors select-none touch-manipulation ${
    isDragging ? 'pointer-events-none border-primary/40 bg-primary/5 shadow-sm' : ''
  }`;

  if (!isEditing) {
    return (
      <li
        className={rowClassName}
        data-exercise-row-index={exerciseIndex}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        onPointerDown={handlePointerDown}
      >
        <div className="min-w-0">
          <p className="text-pretty font-semibold leading-tight">{exercise.name}</p>
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
      </li>
    );
  }

  return (
    <li
      className={`${rowClassName} p-2.5`}
      data-exercise-row-index={exerciseIndex}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onPointerDown={handlePointerDown}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{exercise.name}</p>
          <button
            className="shrink-0 text-xs text-destructive"
            type="button"
            onClick={onRemove}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
          >
            {labels.removeExercise}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2" data-no-swipe onPointerDown={(e) => e.stopPropagation()}>
          <MetricInput
            kind="sets"
            label=""
            showLabel={false}
            value={exercise.targetSets}
            wheelSize="compact"
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
            wheelSize="compact"
            onChange={(value) => {
              onUpdate('targetReps', value ?? 8);
            }}
          />
          <MetricInput
            kind="weight"
            label={labels.targetWeight}
            showLabel={false}
            value={exercise.targetWeightKg}
            wheelSize="compact"
            onChange={(value) => {
              onUpdate('targetWeightKg', value);
            }}
          />
          <MetricInput
            kind="rest"
            label={labels.restSeconds}
            showLabel={false}
            value={exercise.restSeconds}
            wheelSize="compact"
            onChange={(value) => {
              onUpdate('restSeconds', value ?? 0);
            }}
          />
        </div>
        <Button
          className="mt-2 w-full"
          size="sm"
          type="button"
          variant="outline"
          onClick={onDone}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          {labels.doneEditing}
        </Button>
      </div>
    </li>
  );
}
