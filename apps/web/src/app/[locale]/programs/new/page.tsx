'use client';

import type { ExerciseListItem } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { createProgram, publishProgram, searchExercises } from '@/lib/api-auth';
import { trackEvent } from '@/lib/analytics';

interface BuilderExercise {
  exercise: ExerciseListItem;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
}

export default function NewProgramPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [name, setName] = useState('');
  const [dayLabel, setDayLabel] = useState('Day A');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ExerciseListItem[]>([]);
  const [selected, setSelected] = useState<BuilderExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(): Promise<void> {
    if (!accessToken || search.trim().length < 2) {
      return;
    }
    const exercises = await searchExercises(accessToken, search.trim());
    setResults(exercises);
  }

  function addExercise(exercise: ExerciseListItem): void {
    setSelected((prev) => [...prev, { exercise, targetSets: 3, targetReps: 8, restSeconds: 90 }]);
    setResults([]);
    setSearch('');
  }

  async function handleSave(): Promise<void> {
    if (!accessToken || selected.length === 0 || name.trim().length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createProgram(accessToken, {
        name: name.trim(),
        days: [
          {
            label: dayLabel,
            exercises: selected.map((row) => ({
              exerciseLibraryId: row.exercise.id,
              targetSets: row.targetSets,
              targetReps: row.targetReps,
              restSeconds: row.restSeconds,
            })),
          },
        ],
      });
      const published = await publishProgram(accessToken, created.id);
      trackEvent('program_created', { program_id: published.id, source: 'manual' });
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">{t('builderTitle')}</h1>
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
        <label className="flex flex-col gap-1 text-sm">
          {t('dayLabel')}
          <input
            className="rounded-md border px-3 py-2"
            value={dayLabel}
            onChange={(e) => {
              setDayLabel(e.target.value);
            }}
            required
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
                {exercise.names.en}
              </button>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {selected.map((row) => (
              <li key={row.exercise.id} className="rounded border p-2">
                {row.exercise.names.en} — {row.targetSets}×{row.targetReps}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="button"
          disabled={loading || selected.length === 0 || name.trim().length === 0}
          onClick={() => {
            void handleSave();
          }}
        >
          {t('saveAndPublish')}
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/${locale}/programs/templates`}>{t('useTemplate')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
