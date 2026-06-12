'use client';

import type { CreateCustomExercise, ExerciseListItem } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { createCustomExercise, fetchExercises, searchExercises } from '@/lib/api-auth';

const MUSCLE_OPTIONS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'core',
  'calves',
];

function exerciseDisplayName(exercise: ExerciseListItem, locale: string): string {
  if (locale === 'it' && exercise.names.it) {
    return exercise.names.it;
  }
  return exercise.names.en;
}

export default function ExercisesPage(): React.ReactElement {
  const t = useTranslations('Exercises');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [items, setItems] = useState<ExerciseListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCustomExercise>({
    names: { en: '', it: '' },
    category: 'custom',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'other',
    isBodyweight: false,
  });

  const loadExercises = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const exercises =
        search.trim().length >= 2
          ? await searchExercises(accessToken, search.trim())
          : await fetchExercises(accessToken);
      setItems(exercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, search, t]);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  async function handleCreate(): Promise<void> {
    if (!accessToken || form.names.en.trim().length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: CreateCustomExercise = {
        ...form,
        names: {
          en: form.names.en.trim(),
          ...(form.names.it?.trim() ? { it: form.names.it.trim() } : {}),
        },
      };
      await createCustomExercise(accessToken, payload);
      setShowForm(false);
      setForm({
        names: { en: '', it: '' },
        category: 'custom',
        primaryMuscles: ['chest'],
        secondaryMuscles: [],
        equipment: 'other',
        isBodyweight: false,
      });
      await loadExercises();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <input
            className="min-h-11 flex-1 rounded-md border px-3 text-sm"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          <Button
            className="min-h-11"
            type="button"
            variant="outline"
            onClick={() => void loadExercises()}
          >
            {t('search')}
          </Button>
        </div>

        <Button
          className="min-h-11"
          type="button"
          variant="outline"
          onClick={() => {
            setShowForm((value) => !value);
          }}
        >
          {showForm ? t('hideCustomForm') : t('addCustom')}
        </Button>

        {showForm && (
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <label className="flex flex-col gap-1 text-sm">
              {t('nameEn')}
              <input
                className="rounded-md border px-3 py-2"
                value={form.names.en}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, names: { ...prev.names, en: e.target.value } }));
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('nameIt')}
              <input
                className="rounded-md border px-3 py-2"
                value={form.names.it ?? ''}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, names: { ...prev.names, it: e.target.value } }));
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('primaryMuscle')}
              <select
                className="rounded-md border px-3 py-2"
                value={form.primaryMuscles[0] ?? 'chest'}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, primaryMuscles: [e.target.value] }));
                }}
              >
                {MUSCLE_OPTIONS.map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={form.isBodyweight}
                type="checkbox"
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, isBodyweight: e.target.checked }));
                }}
              />
              {t('bodyweight')}
            </label>
            <Button
              className="min-h-11"
              disabled={loading}
              type="button"
              onClick={() => void handleCreate()}
            >
              {t('saveCustom')}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((exercise) => (
              <li key={exercise.id} className="rounded-lg border p-3">
                <p className="font-medium">{exerciseDisplayName(exercise, locale)}</p>
                <p className="text-xs text-muted-foreground">
                  {exercise.category}
                  {exercise.isCustom ? ` · ${t('customBadge')}` : ''}
                  {' · '}
                  {exercise.equipment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
