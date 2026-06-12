'use client';

import type { CreateCustomExercise, ExerciseListItem, MuscleGroup } from '@onemore/shared';
import { EQUIPMENT_TYPES, FILTER_EQUIPMENT_TYPES, FILTER_EXERCISE_CATEGORIES } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { MuscleGroupFilter } from '@/components/muscle-group-filter';
import { MuscleTagPicker } from '@/components/muscle-tag-picker';
import { RequireAuth } from '@/components/require-auth';
import { createCustomExercise, fetchExercises, type ExerciseQueryFilters } from '@/lib/api-auth';

type EquipmentGroup = NonNullable<ExerciseQueryFilters['equipmentGroup']>;

const EQUIPMENT_GROUP_CHIPS: Array<{ id: EquipmentGroup | 'all'; labelKey: string }> = [
  { id: 'all', labelKey: 'filterAll' },
  { id: 'machines', labelKey: 'filterMachinesOnly' },
  { id: 'bodyweight', labelKey: 'filterBodyweightOnly' },
  { id: 'free_weights', labelKey: 'filterFreeWeights' },
  { id: 'cables', labelKey: 'filterCables' },
  { id: 'cardio', labelKey: 'filterCardio' },
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
  const [category, setCategory] = useState('');
  const [equipment, setEquipment] = useState('');
  const [equipmentGroup, setEquipmentGroup] = useState<EquipmentGroup | 'all'>('all');
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

  const hasActiveFilters =
    category !== '' || equipment !== '' || equipmentGroup !== 'all' || muscle !== '';

  const queryFilters = useMemo((): ExerciseQueryFilters => {
    const filters: ExerciseQueryFilters = { limit: 100 };
    const trimmedSearch = search.trim();
    if (trimmedSearch.length >= 2) {
      filters.q = trimmedSearch;
    }
    if (category) {
      filters.category = category;
    }
    if (equipment) {
      filters.equipment = equipment;
    }
    if (equipmentGroup !== 'all') {
      filters.equipmentGroup = equipmentGroup;
    }
    if (muscle) {
      filters.muscle = muscle;
    }
    return filters;
  }, [category, equipment, equipmentGroup, muscle, search]);

  const loadExercises = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const exercises = await fetchExercises(accessToken, queryFilters);
      setItems(exercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, queryFilters, t]);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  function clearFilters(): void {
    setCategory('');
    setEquipment('');
    setEquipmentGroup('all');
    setMuscle('');
  }

  function handleEquipmentGroupChange(group: EquipmentGroup | 'all'): void {
    setEquipmentGroup(group);
    if (group !== 'all') {
      setEquipment('');
    }
  }

  function handleEquipmentChange(value: string): void {
    setEquipment(value);
    if (value) {
      setEquipmentGroup('all');
    }
  }

  function labelCategory(value: string): string {
    if ((FILTER_EXERCISE_CATEGORIES as readonly string[]).includes(value)) {
      return t(`categories.${value}` as 'categories.chest');
    }
    return value;
  }

  function labelEquipment(value: string): string {
    const knownLabels = [...FILTER_EQUIPMENT_TYPES, 'other'] as string[];
    if (knownLabels.includes(value)) {
      return t(`equipmentLabels.${value}` as 'equipmentLabels.barbell');
    }
    return value.replace(/_/g, ' ');
  }

  async function handleCreate(): Promise<void> {
    if (!accessToken || form.names.en.trim().length === 0 || form.primaryMuscles.length === 0) {
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

        <MuscleGroupFilter
          value={muscle}
          onChange={(nextMuscle) => {
            setMuscle(nextMuscle);
          }}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_GROUP_CHIPS.map((chip) => {
              const active = equipmentGroup === chip.id;
              return (
                <Button
                  key={chip.id}
                  className="min-h-9"
                  size="sm"
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => {
                    handleEquipmentGroupChange(chip.id);
                  }}
                >
                  {t(chip.labelKey as 'filterAll')}
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t('filterCategory')}
              <select
                className="min-h-11 rounded-md border bg-background px-2 text-sm text-foreground"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                }}
              >
                <option value="">{t('filterAll')}</option>
                {FILTER_EXERCISE_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {labelCategory(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t('filterEquipment')}
              <select
                className="min-h-11 rounded-md border bg-background px-2 text-sm text-foreground"
                value={equipment}
                onChange={(e) => {
                  handleEquipmentChange(e.target.value);
                }}
              >
                <option value="">{t('filterAll')}</option>
                {FILTER_EQUIPMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {labelEquipment(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasActiveFilters && (
            <Button
              className="min-h-9 self-start"
              size="sm"
              type="button"
              variant="ghost"
              onClick={clearFilters}
            >
              {t('clearFilters')}
            </Button>
          )}
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
            <MuscleTagPicker
              value={form.primaryMuscles}
              onChange={(tags) => {
                setForm((prev) => ({ ...prev, primaryMuscles: tags }));
              }}
            />
            <label className="flex flex-col gap-1 text-sm">
              {t('equipmentField')}
              <select
                className="rounded-md border px-3 py-2"
                value={form.equipment}
                onChange={(e) => {
                  const nextEquipment = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    equipment: nextEquipment,
                    isBodyweight: nextEquipment === 'bodyweight',
                  }));
                }}
              >
                {EQUIPMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {labelEquipment(value)}
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
                  {labelCategory(exercise.category)}
                  {exercise.isCustom ? ` · ${t('customBadge')}` : ''}
                  {' · '}
                  {labelEquipment(exercise.equipment)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
