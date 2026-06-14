'use client';

import { Button } from '@onemore/ui';

import { useExerciseRowLongPressDrag } from '@/hooks/use-exercise-row-long-press-drag';
import { MetricInput } from '@/components/metric-input';
import { formatProgramExerciseSummary } from '@/lib/program-exercise-display';

import type { BuilderExercise } from './program-builder-types';

interface ProgramBuilderExerciseRowProps {
  exercise: BuilderExercise;
  exerciseIndex: number;
  isEditing: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
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
  onDragStart: (exerciseIndex: number, rect: DOMRect) => void;
  onDragMove: (clientX: number, clientY: number) => void;
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
  isDragSource,
  isDropTarget,
  labels,
  onEdit,
  onDone,
  onRemove,
  onDragStart,
  onDragMove,
  onDragEnd,
  onUpdate,
}: ProgramBuilderExerciseRowProps): React.ReactElement {
  const { handlePointerDown } = useExerciseRowLongPressDrag({
    exerciseIndex,
    enabled: !isEditing,
    onDragEnd,
    onDragMove,
    onDragStart,
    onTap: onEdit,
  });

  const rowClassName = `rounded-xl border px-3 py-3 transition-all select-none touch-manipulation ${
    isDragSource ? 'border-dashed border-primary/30 bg-primary/5 opacity-30' : ''
  } ${isDropTarget ? 'border-primary ring-2 ring-primary/30' : ''}`;

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
    <li className={`${rowClassName} p-2.5`} data-exercise-row-index={exerciseIndex}>
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
        <div
          className="mt-2 grid grid-cols-2 gap-2"
          data-no-swipe
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
        >
          <MetricInput
            kind="sets"
            label={labels.targetSets}
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
