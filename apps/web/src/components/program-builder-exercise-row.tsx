'use client';

import { Button } from '@onemore/ui';
import { GripHorizontal } from 'lucide-react';

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
    editExercise: string;
    removeExercise: string;
    doneEditing: string;
    reorderExercise: string;
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
 * Single exercise row in the program builder: compact view or inline edit mode.
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
  const dragHandle = (
    <button
      aria-label={labels.reorderExercise}
      className="touch-none rounded-md p-2 text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground active:cursor-grabbing"
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragStart(exerciseIndex);
      }}
      onPointerUp={(event) => {
        onDragEnd();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        onDragEnd();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
    >
      <GripHorizontal aria-hidden className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );

  if (!isEditing) {
    return (
      <li
        className={`rounded-xl border px-3 py-3 transition-colors ${isDragging ? 'border-primary/40 bg-primary/5' : ''}`}
        onPointerEnter={() => {
          onDragEnter(exerciseIndex);
        }}
      >
        <div className="flex items-start gap-2">
          {dragHandle}
          <div className="min-w-0 flex-1">
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
    <li
      className={`rounded-xl border p-2.5 transition-colors ${isDragging ? 'border-primary/40 bg-primary/5' : ''}`}
      onPointerEnter={() => {
        onDragEnter(exerciseIndex);
      }}
    >
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{exercise.name}</p>
            <button className="shrink-0 text-xs text-destructive" type="button" onClick={onRemove}>
              {labels.removeExercise}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
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
          >
            {labels.doneEditing}
          </Button>
        </div>
      </div>
    </li>
  );
}
