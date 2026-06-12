'use client';

import type { CreateCustomExercise, ExerciseListItem } from '@onemore/shared';
import {
  EQUIPMENT_TYPES,
  FILTER_EQUIPMENT_TYPES,
  FILTER_EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from '@onemore/shared';
import { Button, Card, CardContent, Input } from '@onemore/ui';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { GymSearchField } from '@/components/gym-ui/gym-search-field';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { AnimatedDialog } from '@/components/motion/animated-dialog';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { createCustomExercise, fetchExercises, type ExerciseQueryFilters } from '@/lib/api-auth';

const SEARCH_DEBOUNCE_MS = 250;

function exerciseDisplayName(exercise: ExerciseListItem, locale: string): string {
  if (locale === 'it' && exercise.names.it) {
    return exercise.names.it;
  }
  return exercise.names.en;
}

export default function ExercisesPage(): React.ReactElement {
  const t = useTranslations('Exercises');
  const tMuscle = useTranslations('MuscleGroups');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [items, setItems] = useState<ExerciseListItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [equipment, setEquipment] = useState('');
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

  const hasActiveFilters = category !== '' || equipment !== '';

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [search]);

  const queryFilters = useMemo((): ExerciseQueryFilters => {
    const filters: ExerciseQueryFilters = { limit: 100 };
    if (debouncedSearch.length >= 1) {
      filters.q = debouncedSearch;
    }
    if (category) {
      filters.category = category;
    }
    if (equipment) {
      filters.equipment = equipment;
    }
    return filters;
  }, [category, debouncedSearch, equipment]);

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

  function closeForm(): void {
    setShowForm(false);
    setForm({
      names: { en: '', it: '' },
      category: 'custom',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: 'other',
      isBodyweight: false,
    });
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
        isBodyweight: form.equipment === 'bodyweight',
      };
      await createCustomExercise(accessToken, payload);
      closeForm();
      await loadExercises();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
      setLoading(false);
    }
  }

  const headerActions = (
    <button
      aria-label={t('addCustom')}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gym-separator bg-gym-surface text-xl leading-none text-primary shadow-sm transition-transform active:scale-95"
      type="button"
      onClick={() => {
        setShowForm(true);
      }}
    >
      +
    </button>
  );

  const searchField = isDesktop ? (
    <Input
      className="max-w-md"
      enterKeyHint="search"
      inputMode="search"
      placeholder={t('searchPlaceholder')}
      type="search"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
      }}
    />
  ) : (
    <GymSearchField
      placeholder={t('searchPlaceholder')}
      value={search}
      onChange={setSearch}
    />
  );

  const exerciseListMobile = (
    <GymListGroup>
      {items.map((exercise) => (
        <GymListRow
          key={exercise.id}
          meta={exercise.isCustom ? t('customBadge') : undefined}
          subtitle={`${labelCategory(exercise.category)} · ${labelEquipment(exercise.equipment)}`}
          title={exerciseDisplayName(exercise, locale)}
        />
      ))}
    </GymListGroup>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={t('title')}
        variant="wide"
        actions={headerActions}
      >
        {searchField}

        <div className="flex flex-col gap-3">
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
                  setEquipment(e.target.value);
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

          {hasActiveFilters ? (
            <Button
              className="min-h-9 self-start"
              size="sm"
              type="button"
              variant="ghost"
              onClick={clearFilters}
            >
              {t('clearFilters')}
            </Button>
          ) : null}
        </div>

        {showForm ? (
          <AnimatedDialog
            ariaLabelledby="create-custom-exercise-title"
            className="max-w-md rounded-2xl p-0"
            overlayClassName="z-[60] flex items-center justify-center p-4"
            onOverlayClick={closeForm}
          >
            <div className="flex flex-col gap-3 p-6">
              <h2 id="create-custom-exercise-title" className="text-lg font-semibold">
                {t('addCustom')}
              </h2>
              <label className="flex flex-col gap-1 text-sm">
                {t('nameEn')}
                <Input
                  value={form.names.en}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, names: { ...prev.names, en: e.target.value } }));
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t('nameIt')}
                <Input
                  value={form.names.it ?? ''}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, names: { ...prev.names, it: e.target.value } }));
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t('primaryMuscle')}
                <select
                  className="min-h-11 rounded-md border bg-background px-2 text-sm text-foreground"
                  value={form.primaryMuscles[0] ?? 'chest'}
                  onChange={(e) => {
                    const nextMuscle = e.target.value as MuscleGroup;
                    setForm((prev) => ({ ...prev, primaryMuscles: [nextMuscle] }));
                  }}
                >
                  {MUSCLE_GROUPS.map((value) => (
                    <option key={value} value={value}>
                      {tMuscle(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t('equipmentField')}
                <select
                  className="min-h-11 rounded-md border bg-background px-2 text-sm text-foreground"
                  value={form.equipment}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, equipment: e.target.value }));
                  }}
                >
                  {EQUIPMENT_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {labelEquipment(value)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-1 flex gap-2">
                <Button className="flex-1" type="button" variant="outline" onClick={closeForm}>
                  {t('cancelCustom')}
                </Button>
                <Button
                  className="flex-1"
                  disabled={loading || form.names.en.trim().length === 0}
                  type="button"
                  onClick={() => {
                    void handleCreate();
                  }}
                >
                  {t('saveCustom')}
                </Button>
              </div>
            </div>
          </AnimatedDialog>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 9 : 4} columns="3" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : isDesktop ? (
          <StaggerGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((exercise) => (
              <StaggerItem key={exercise.id}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <p className="font-medium">{exerciseDisplayName(exercise, locale)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {labelCategory(exercise.category)}
                      {exercise.isCustom ? ` · ${t('customBadge')}` : ''}
                      {' · '}
                      {labelEquipment(exercise.equipment)}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <StaggerGroup compact>
            <StaggerItem>{exerciseListMobile}</StaggerItem>
          </StaggerGroup>
        )}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
