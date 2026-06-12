'use client';

import type { CreateProgramInput, ExerciseListItem } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { searchExercises } from '@/lib/api-auth';

export interface BuilderExercise {
  exerciseLibraryId: string;
  name: string;
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

/**
 * Multi-day program editor with exercise search and per-exercise prescription fields.
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
  const [name, setName] = useState(initialName);
  const [days, setDays] = useState<BuilderDay[]>(
    initialDays && initialDays.length > 0 ? initialDays : [emptyDay(0)],
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ExerciseListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDay = days[dayIndex] ?? days[0];

  async function handleSearch(): Promise<void> {
    if (search.trim().length < 2) {
      return;
    }
    const exercises = await searchExercises(accessToken, search.trim());
    setResults(exercises);
  }

  function addExercise(exercise: ExerciseListItem): void {
    const displayName =
      locale === 'it' && exercise.names.it ? exercise.names.it : exercise.names.en;
    setDays((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  exerciseLibraryId: exercise.id,
                  name: displayName,
                  targetSets: 3,
                  targetReps: 8,
                  restSeconds: 90,
                  targetWeightKg: null,
                },
              ],
            }
          : day,
      ),
    );
    setResults([]);
    setSearch('');
  }

  function updateExercise(
    exerciseIndex: number,
    field: keyof BuilderExercise,
    value: string | number | null,
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
        {days.map((day, index) => (
          <Button
            key={`${day.label}-${String(index)}`}
            type="button"
            size="sm"
            variant={index === dayIndex ? 'default' : 'outline'}
            onClick={() => {
              setDayIndex(index);
            }}
          >
            {day.label}
          </Button>
        ))}
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
      </label>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder={t('searchExercises')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void handleSearch();
          }}
        >
          {t('search')}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className="rounded border p-2 text-left text-sm"
              onClick={() => {
                addExercise(exercise);
              }}
            >
              {locale === 'it' && exercise.names.it ? exercise.names.it : exercise.names.en}
            </button>
          ))}
        </div>
      )}

      {(currentDay?.exercises.length ?? 0) > 0 && (
        <ul className="flex flex-col gap-3">
          {currentDay?.exercises.map((row, exerciseIndex) => (
            <li key={`${row.exerciseLibraryId}-${String(exerciseIndex)}`} className="rounded border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{row.name}</p>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => {
                    removeExercise(exerciseIndex);
                  }}
                >
                  {t('removeExercise')}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col gap-1">
                  {t('targetSets')}
                  <input
                    className="rounded border px-2 py-1"
                    type="number"
                    min={1}
                    value={row.targetSets}
                    onChange={(e) => {
                      updateExercise(exerciseIndex, 'targetSets', Number(e.target.value));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  {t('targetReps')}
                  <input
                    className="rounded border px-2 py-1"
                    type="number"
                    min={1}
                    value={row.targetReps}
                    onChange={(e) => {
                      updateExercise(exerciseIndex, 'targetReps', Number(e.target.value));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  {t('restSeconds')}
                  <input
                    className="rounded border px-2 py-1"
                    type="number"
                    min={0}
                    value={row.restSeconds}
                    onChange={(e) => {
                      updateExercise(exerciseIndex, 'restSeconds', Number(e.target.value));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  {t('targetWeight')}
                  <input
                    className="rounded border px-2 py-1"
                    type="number"
                    min={0}
                    value={row.targetWeightKg ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      updateExercise(exerciseIndex, 'targetWeightKg', value);
                    }}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
