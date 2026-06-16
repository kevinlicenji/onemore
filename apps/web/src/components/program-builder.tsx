'use client';

import type { CreateProgramInput, MuscleGroup } from '@onemore/shared';
import {
  aggregateMuscleGroups,
  computeDayDifficulty,
  localizeWorkoutDayLabel,
} from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AddProgramExerciseModal,
  type ProgramExerciseDraft,
} from '@/components/add-program-exercise-modal';
import { ProgramBuilderExerciseRow } from '@/components/program-builder-exercise-row';
import { ThemedTextInput } from '@/components/themed-text-input';
import { DifficultyLevelPicker } from '@/components/difficulty-level-picker';
import { collectExerciseRowBounds, findDropIndexFromPointerY } from '@/lib/exercise-drag-overlay';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';
import { formatProgramExerciseSummary } from '@/lib/program-exercise-display';
import { moveArrayItem } from '@/lib/move-array-item';

import { emptyBuilderDay, type BuilderDay, type BuilderExercise } from './program-builder-types';

export type { BuilderExercise, BuilderDay } from './program-builder-types';

function syncAutoDifficulty(day: BuilderDay): BuilderDay {
  if (day.difficultyManual || day.exercises.length === 0) {
    return day;
  }
  return {
    ...day,
    difficultyLevel: computeDayDifficulty(
      day.exercises.map((row) => ({
        targetSets: row.targetSets,
        targetReps: row.targetReps,
        restSeconds: row.restSeconds,
      })),
    ),
  };
}

interface DragOverlayState {
  fromIndex: number;
  overIndex: number;
  pointerX: number;
  pointerY: number;
  offsetY: number;
  width: number;
  height: number;
  exercise: BuilderExercise;
}

interface ProgramBuilderProps {
  accessToken: string;
  locale: string;
  initialName?: string;
  initialDays?: BuilderDay[];
  initialDayIndex?: number;
  startWithNewDay?: boolean;
  dayFocusMode?: boolean;
  submitLabel: string;
  onSubmit: (input: CreateProgramInput) => Promise<void>;
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
  initialDayIndex = 0,
  startWithNewDay = false,
  dayFocusMode = false,
  submitLabel,
  onSubmit,
}: ProgramBuilderProps): React.ReactElement {
  const t = useTranslations('Programs');
  const tMuscle = useTranslations('MuscleGroups');
  const listRef = useRef<HTMLUListElement>(null);
  const [name, setName] = useState(initialName);
  const [days, setDays] = useState<BuilderDay[]>(
    initialDays && initialDays.length > 0 ? initialDays : [emptyBuilderDay(0, locale)],
  );
  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [dragOverlay, setDragOverlay] = useState<DragOverlayState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didSeedNewDay, setDidSeedNewDay] = useState(false);

  useEffect(() => {
    if (initialDays && initialDays.length > 0) {
      setDays(initialDays);
    }
  }, [initialDays]);

  useEffect(() => {
    if (initialDayIndex >= 0 && initialDayIndex < days.length) {
      setDayIndex(initialDayIndex);
    }
  }, [days.length, initialDayIndex]);

  useEffect(() => {
    if (!startWithNewDay || didSeedNewDay) {
      return;
    }
    setDays((prev) => {
      const next = [...prev, emptyBuilderDay(prev.length, locale)];
      setDayIndex(next.length - 1);
      return next;
    });
    setDidSeedNewDay(true);
  }, [didSeedNewDay, locale, startWithNewDay]);

  const currentDay = days[dayIndex] ?? days[0];
  const isDragging = dragOverlay !== null;

  function addExercise(draft: ProgramExerciseDraft): void {
    setDays((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }
        return syncAutoDifficulty({
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
              targetWeightKg:
                draft.weightPrescriptionMode === 'percent_of_max' ? null : draft.targetWeightKg,
              weightPrescriptionMode: draft.weightPrescriptionMode,
              targetPercentOfMax:
                draft.weightPrescriptionMode === 'percent_of_max' ? draft.targetPercentOfMax : null,
            },
          ],
        });
      }),
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
        return syncAutoDifficulty({ ...day, exercises });
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
      prev.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }
        return syncAutoDifficulty({
          ...day,
          exercises: day.exercises.filter((_, i) => i !== exerciseIndex),
        });
      }),
    );
  }

  function addDay(): void {
    setDays((prev) => {
      const next = [...prev, emptyBuilderDay(prev.length, locale)];
      setDayIndex(next.length - 1);
      return next;
    });
    setEditingExerciseIndex(null);
  }

  function reorderExercise(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return;
    }

    setDays((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }
        return { ...day, exercises: moveArrayItem(day.exercises, fromIndex, toIndex) };
      }),
    );

    setEditingExerciseIndex((current) => {
      if (current === null) {
        return null;
      }
      if (current === fromIndex) {
        return toIndex;
      }
      if (fromIndex < current && toIndex >= current) {
        return current - 1;
      }
      if (fromIndex > current && toIndex <= current) {
        return current + 1;
      }
      return current;
    });
  }

  function updateDragOverIndex(clientX: number, clientY: number): void {
    setDragOverlay((current) => {
      if (!current || !listRef.current) {
        return current;
      }
      const listRect = listRef.current.getBoundingClientRect();
      const bounds = collectExerciseRowBounds(listRef.current);
      const overIndex = findDropIndexFromPointerY(
        bounds,
        clientY - listRect.top,
        currentDay?.exercises.length ?? 0,
      );
      return {
        ...current,
        pointerX: clientX,
        pointerY: clientY,
        overIndex,
      };
    });
  }

  function handleDragStart(index: number, rect: DOMRect): void {
    const exercise = currentDay?.exercises[index];
    if (!exercise) {
      return;
    }
    setEditingExerciseIndex(null);
    setDragOverlay({
      fromIndex: index,
      overIndex: index,
      pointerX: rect.left + rect.width / 2,
      pointerY: rect.top + rect.height / 2,
      offsetY: rect.height / 2,
      width: rect.width,
      height: rect.height,
      exercise,
    });
  }

  function handleDragEnd(): void {
    setDragOverlay((current) => {
      if (current && current.fromIndex !== current.overIndex) {
        reorderExercise(current.fromIndex, current.overIndex);
      }
      return null;
    });
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
          difficultyLevel: day.difficultyLevel,
          exercises: day.exercises.map((row) => ({
            exerciseLibraryId: row.exerciseLibraryId,
            targetSets: row.targetSets,
            targetReps: row.targetReps,
            restSeconds: row.restSeconds,
            weightPrescriptionMode: row.weightPrescriptionMode ?? 'absolute',
            ...(row.weightPrescriptionMode === 'percent_of_max' && row.targetPercentOfMax != null
              ? { targetPercentOfMax: row.targetPercentOfMax }
              : row.targetWeightKg !== null
                ? { targetWeightKg: row.targetWeightKg }
                : {}),
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

  const dragGhost =
    dragOverlay && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[80] rounded-xl border-2 border-primary/50 bg-card px-3 py-3 shadow-2xl ring-2 ring-primary/20"
            style={{
              width: dragOverlay.width,
              left: dragOverlay.pointerX - dragOverlay.width / 2,
              top: dragOverlay.pointerY - dragOverlay.offsetY,
              transform: 'scale(1.03)',
            }}
          >
            <p className="text-pretty font-semibold leading-tight">{dragOverlay.exercise.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatProgramExerciseSummary(
                dragOverlay.exercise.targetSets,
                dragOverlay.exercise.targetReps,
                dragOverlay.exercise.targetWeightKg,
                dragOverlay.exercise.restSeconds,
                t('failureReps'),
                dragOverlay.exercise.weightPrescriptionMode,
                dragOverlay.exercise.targetPercentOfMax,
              )}
            </p>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-col gap-4">
      {!dayFocusMode ? (
        <label className="flex flex-col gap-1 text-sm">
          {t('programName')}
          <ThemedTextInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
        </label>
      ) : null}

      {!dayFocusMode ? (
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
                {localizeWorkoutDayLabel(day.label, locale)}
                {muscles ? ` — ${muscles}` : ''}
              </Button>
            );
          })}
          <Button type="button" size="sm" variant="ghost" onClick={addDay}>
            {t('addDay')}
          </Button>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        {t('dayLabel')}
        <ThemedTextInput
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

      {currentDay ? (
        <DifficultyLevelPicker
          value={currentDay.difficultyLevel}
          onChange={(level) => {
            setDays((prev) =>
              prev.map((day, index) =>
                index === dayIndex
                  ? { ...day, difficultyLevel: level, difficultyManual: true }
                  : day,
              ),
            );
          }}
        />
      ) : null}

      {(currentDay?.exercises.length ?? 0) > 0 && (
        <ul
          ref={listRef}
          className={`relative flex flex-col gap-3 ${isDragging ? 'touch-none' : ''}`}
        >
          {currentDay?.exercises.map((row, exerciseIndex) => (
            <ProgramBuilderExerciseRow
              key={`${row.exerciseLibraryId}-${String(exerciseIndex)}`}
              exercise={row}
              exerciseIndex={exerciseIndex}
              isDragSource={dragOverlay?.fromIndex === exerciseIndex}
              isDropTarget={
                dragOverlay !== null &&
                dragOverlay.overIndex === exerciseIndex &&
                dragOverlay.fromIndex !== exerciseIndex
              }
              isEditing={editingExerciseIndex === exerciseIndex}
              labels={{
                failureReps: t('failureReps'),
                removeExercise: t('removeExercise'),
                doneEditing: t('doneEditing'),
                targetSets: t('targetSets'),
                targetReps: t('targetReps'),
                targetWeight: t('targetWeight'),
                restSeconds: t('restSeconds'),
              }}
              onDragEnd={handleDragEnd}
              onDragMove={updateDragOverIndex}
              onDragStart={handleDragStart}
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

      <Button
        className="min-h-11"
        type="button"
        variant="outline"
        onClick={() => {
          setAddModalOpen(true);
        }}
      >
        {t('addExercise')}
      </Button>

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

      {dragGhost}
    </div>
  );
}
