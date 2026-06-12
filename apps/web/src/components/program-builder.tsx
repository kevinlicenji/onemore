'use client';

import type { CreateProgramInput, MuscleGroup } from '@onemore/shared';
import { aggregateMuscleGroups } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  AddProgramExerciseModal,
  type ProgramExerciseDraft,
} from '@/components/add-program-exercise-modal';
import { ProgramBuilderExerciseRow } from '@/components/program-builder-exercise-row';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';

export interface BuilderExercise {
  exerciseLibraryId: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  targetWeightKg: number | null;
}

export interface BuilderDay {
  label: string;
  exercises: BuilderExercise[];
}

interface ProgramBuilderProps {
  accessToken: string;
  locale: string;
  initialName?: string;
  initialDays?: BuilderDay[];
  submitLabel: string;
  onSubmit: (input: CreateProgramInput) => Promise<void>;
}

function emptyDay(index: number): BuilderDay {
  return { label: `Day ${String.fromCharCode(65 + index)}`, exercises: [] };
}

function dayMuscleLabel(day: BuilderDay, translate: (key: MuscleGroup) => string): string {
  return formatMuscleGroupsForLocale(
    aggregateMuscleGroups(day.exercises.map((row) => ({ primaryMuscles: row.primaryMuscles }))),
    translate,
  );
}

/**
 * Multi-day program editor with modal exercise picker and shared metric inputs.
 */
export function ProgramBuilder({
  accessToken,
  locale,
  initialName = '',
  initialDays,
  submitLabel,
  onSubmit,
}: ProgramBuilderProps): React.ReactElement {
  const t = useTranslations('Programs');
  const tMuscle = useTranslations('MuscleGroups');
  const [name, setName] = useState(initialName);
  const [days, setDays] = useState<BuilderDay[]>(
    initialDays && initialDays.length > 0 ? initialDays : [emptyDay(0)],
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDay = days[dayIndex] ?? days[0];

  function addExercise(draft: ProgramExerciseDraft): void {
    setDays((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  exerciseLibraryId: draft.exerciseLibraryId,
                  name: draft.name,
                  primaryMuscles: draft.primaryMuscles,
                  targetSets: draft.targetSets,
                  targetReps: draft.targetReps,
                  restSeconds: draft.restSeconds,
                  targetWeightKg: draft.targetWeightKg,
                },
              ],
            }
          : day,
      ),
    );
  }

  function updateExercise(
    exerciseIndex: number,
    field: keyof BuilderExercise,
    value: string | number | null | MuscleGroup[],
  ): void {
    setDays((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }
        const exercises = day.exercises.map((row, rowIndex) => {
          if (rowIndex !== exerciseIndex) {
            return row;
          }
          return { ...row, [field]: value };
        });
        return { ...day, exercises };
      }),
    );
  }

  function removeExercise(exerciseIndex: number): void {
    setEditingExerciseIndex((current) =>
      current === exerciseIndex
        ? null
        : current !== null && current > exerciseIndex
          ? current - 1
          : current,
    );
    setDays((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, exercises: day.exercises.filter((_, i) => i !== exerciseIndex) }
          : day,
      ),
    );
  }

  function addDay(): void {
    setDays((prev) => [...prev, emptyDay(prev.length)]);
    setDayIndex(days.length);
  }

  async function handleSave(): Promise<void> {
    const validDays = days.filter((day) => day.exercises.length > 0);
    if (name.trim().length === 0 || validDays.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        days: validDays.map((day) => ({
          label: day.label,
          exercises: day.exercises.map((row) => ({
            exerciseLibraryId: row.exerciseLibraryId,
            targetSets: row.targetSets,
            targetReps: row.targetReps,
            restSeconds: row.restSeconds,
            ...(row.targetWeightKg !== null ? { targetWeightKg: row.targetWeightKg } : {}),
          })),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setLoading(false);
    }
  }

  const canSave =
    name.trim().length > 0 && days.some((day) => day.exercises.length > 0) && !loading;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t('programName')}
        <input
          className="rounded-md border px-3 py-2"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          required
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {days.map((day, index) => {
          const muscles = dayMuscleLabel(day, tMuscle);
          return (
            <Button
              key={`${day.label}-${String(index)}`}
              type="button"
              size="sm"
              variant={index === dayIndex ? 'default' : 'outline'}
              onClick={() => {
                setDayIndex(index);
                setEditingExerciseIndex(null);
              }}
            >
              {day.label}
              {muscles ? ` — ${muscles}` : ''}
            </Button>
          );
        })}
        <Button type="button" size="sm" variant="ghost" onClick={addDay}>
          {t('addDay')}
        </Button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t('dayLabel')}
        <input
          className="rounded-md border px-3 py-2"
          value={currentDay?.label ?? ''}
          onChange={(e) => {
            const nextLabel = e.target.value;
            setDays((prev) =>
              prev.map((day, index) => (index === dayIndex ? { ...day, label: nextLabel } : day)),
            );
          }}
        />
        {currentDay && dayMuscleLabel(currentDay, tMuscle) && (
          <span className="text-xs text-muted-foreground">
            {dayMuscleLabel(currentDay, tMuscle)}
          </span>
        )}
      </label>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setAddModalOpen(true);
        }}
      >
        {t('addExercise')}
      </Button>

      {(currentDay?.exercises.length ?? 0) > 0 && (
        <ul className="flex flex-col gap-3">
          {currentDay?.exercises.map((row, exerciseIndex) => (
            <ProgramBuilderExerciseRow
              key={`${row.exerciseLibraryId}-${String(exerciseIndex)}`}
              exercise={row}
              isEditing={editingExerciseIndex === exerciseIndex}
              labels={{
                failureReps: t('failureReps'),
                editExercise: t('editExercise'),
                removeExercise: t('removeExercise'),
                doneEditing: t('doneEditing'),
                targetSets: t('targetSets'),
                targetReps: t('targetReps'),
                targetWeight: t('targetWeight'),
                restSeconds: t('restSeconds'),
              }}
              onDone={() => {
                setEditingExerciseIndex(null);
              }}
              onEdit={() => {
                setEditingExerciseIndex(exerciseIndex);
              }}
              onRemove={() => {
                removeExercise(exerciseIndex);
              }}
              onUpdate={(field, value) => {
                updateExercise(exerciseIndex, field, value);
              }}
            />
          ))}
        </ul>
      )}

      <AddProgramExerciseModal
        accessToken={accessToken}
        labels={{
          title: t('addExerciseModalTitle'),
          search: t('searchExercises'),
          noResults: t('searchNoResults'),
          searching: t('searchingExercises'),
          add: t('addExerciseConfirm'),
          cancel: t('cancel'),
          targetSets: t('targetSets'),
          targetReps: t('targetReps'),
          restSeconds: t('restSeconds'),
          targetWeight: t('targetWeight'),
          failureReps: t('failureReps'),
        }}
        locale={locale}
        open={addModalOpen}
        translateMuscle={tMuscle}
        onAdd={addExercise}
        onClose={() => {
          setAddModalOpen(false);
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        disabled={!canSave}
        onClick={() => {
          void handleSave();
        }}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
