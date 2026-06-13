'use client';

import type { CreateCustomExercise, ExerciseListItem } from '@onemore/shared';
import { FILTER_EQUIPMENT_TYPES, FILTER_EXERCISE_CATEGORIES } from '@onemore/shared';
import { Button, Card, CardContent, Input, cn } from '@onemore/ui';
import { Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { CreateCustomExerciseForm } from '@/components/create-custom-exercise-form';
import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { GymPickerField } from '@/components/gym-ui/gym-picker-field';
import { GymSearchField } from '@/components/gym-ui/gym-search-field';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  createCustomExercise,
  fetchExercises,
  updateCustomExercise,
  type ExerciseQueryFilters,
} from '@/lib/api-auth';

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
  const [editingExercise, setEditingExercise] = useState<ExerciseListItem | null>(null);
  const [editBodyweight, setEditBodyweight] = useState(false);
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

  const refreshExercises = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setError(null);
    try {
      const exercises = await fetchExercises(accessToken, queryFilters);
      setItems(exercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    }
  }, [accessToken, queryFilters, t]);

  function clearFilters(): void {
    setCategory('');
    setEquipment('');
  }

  const labelCategory = useCallback(
    (value: string): string => {
      if ((FILTER_EXERCISE_CATEGORIES as readonly string[]).includes(value)) {
        return t(`categories.${value}` as 'categories.chest');
      }
      return value;
    },
    [t],
  );

  const labelEquipment = useCallback(
    (value: string): string => {
      const knownLabels = [...FILTER_EQUIPMENT_TYPES, 'other'] as string[];
      if (knownLabels.includes(value)) {
        return t(`equipmentLabels.${value}` as 'equipmentLabels.barbell');
      }
      return value.replace(/_/g, ' ');
    },
    [t],
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('filterAll') },
      ...FILTER_EXERCISE_CATEGORIES.map((value) => ({
        value,
        label: labelCategory(value),
      })),
    ],
    [labelCategory, t],
  );

  const equipmentOptions = useMemo(
    () => [
      { value: '', label: t('filterAll') },
      ...FILTER_EQUIPMENT_TYPES.map((value) => ({
        value,
        label: labelEquipment(value),
      })),
    ],
    [labelEquipment, t],
  );

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
        isBodyweight: form.isBodyweight,
      };
      await createCustomExercise(accessToken, payload);
      closeForm();
      await loadExercises();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
      setLoading(false);
    }
  }

  function openEditExercise(exercise: ExerciseListItem): void {
    if (!exercise.isCustom) {
      return;
    }
    setEditingExercise(exercise);
    setEditBodyweight(exercise.isBodyweight);
  }

  function closeEditExercise(): void {
    setEditingExercise(null);
    setEditBodyweight(false);
  }

  async function handleUpdateBodyweight(): Promise<void> {
    if (!accessToken || !editingExercise) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateCustomExercise(accessToken, editingExercise.id, {
        isBodyweight: editBodyweight,
      });
      closeEditExercise();
      await loadExercises();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updateError'));
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
    <GymSearchField placeholder={t('searchPlaceholder')} value={search} onChange={setSearch} />
  );

  const exerciseListMobile = (
    <GymListGroup>
      {items.map((exercise) => (
        <GymListRow
          key={exercise.id}
          meta={
            exercise.isCustom
              ? `${t('customBadge')}${exercise.isBodyweight ? ` · ${t('bodyweight')}` : ''}`
              : exercise.isBodyweight
                ? t('bodyweight')
                : undefined
          }
          subtitle={`${labelCategory(exercise.category)} · ${labelEquipment(exercise.equipment)}`}
          title={exerciseDisplayName(exercise, locale)}
          onClick={
            exercise.isCustom
              ? () => {
                  openEditExercise(exercise);
                }
              : undefined
          }
        />
      ))}
    </GymListGroup>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        actionsLayout={isDesktop ? 'stacked' : 'inline'}
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={t('title')}
        variant="wide"
        actions={headerActions}
        onRefresh={isDesktop ? undefined : refreshExercises}
      >
        {searchField}

        <div className="flex flex-col gap-3">
          {isDesktop ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <GymPickerField
                label={t('filterCategory')}
                options={categoryOptions}
                value={category}
                onChange={setCategory}
              />
              <GymPickerField
                label={t('filterEquipment')}
                options={equipmentOptions}
                value={equipment}
                onChange={setEquipment}
              />
            </div>
          )}

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

        <GymAdaptiveOverlay
          ariaLabel={t('addCustom')}
          open={showForm}
          tall
          title={t('addCustom')}
          onClose={closeForm}
        >
          <CreateCustomExerciseForm
            form={form}
            labelEquipment={labelEquipment}
            labels={{
              cancelCustom: t('cancelCustom'),
              equipmentField: t('equipmentField'),
              nameEn: t('nameEn'),
              nameIt: t('nameIt'),
              primaryMuscle: t('primaryMuscle'),
              bodyweight: t('bodyweight'),
              saveCustom: t('saveCustom'),
            }}
            loading={loading}
            translateMuscle={tMuscle}
            onCancel={closeForm}
            onChange={setForm}
            onSubmit={() => {
              void handleCreate();
            }}
          />
        </GymAdaptiveOverlay>

        <GymAdaptiveOverlay
          ariaLabel={t('editCustom')}
          open={editingExercise !== null}
          title={t('editCustom')}
          onClose={closeEditExercise}
        >
          {editingExercise ? (
            <div className="flex flex-col gap-4">
              <p className="text-base font-semibold">
                {exerciseDisplayName(editingExercise, locale)}
              </p>
              <label className="flex items-start gap-3 rounded-lg border px-3 py-3 text-sm">
                <input
                  checked={editBodyweight}
                  className="mt-0.5 h-5 w-5 rounded border"
                  type="checkbox"
                  onChange={(e) => {
                    setEditBodyweight(e.target.checked);
                  }}
                />
                <span>
                  <span className="font-medium">{t('bodyweight')}</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {t('editBodyweightHint')}
                  </span>
                </span>
              </label>
              <div className="flex gap-2">
                <Button
                  className="min-h-12 flex-1"
                  type="button"
                  variant="outline"
                  onClick={closeEditExercise}
                >
                  {t('cancelCustom')}
                </Button>
                <Button
                  className="min-h-12 flex-1"
                  disabled={loading}
                  type="button"
                  onClick={() => {
                    void handleUpdateBodyweight();
                  }}
                >
                  {t('saveCustom')}
                </Button>
              </div>
            </div>
          ) : null}
        </GymAdaptiveOverlay>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 9 : 4} columns="3" />
        ) : items.length === 0 ? (
          isDesktop ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <GymEmptyState
              action={
                hasActiveFilters ? (
                  <Button
                    className="min-h-11 w-full"
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                  >
                    {t('clearFilters')}
                  </Button>
                ) : (
                  <Button
                    className="min-h-11 w-full"
                    type="button"
                    onClick={() => {
                      setShowForm(true);
                    }}
                  >
                    {t('addCustom')}
                  </Button>
                )
              }
              icon={<Search aria-hidden className="h-7 w-7" />}
              title={t('empty')}
            />
          )
        ) : isDesktop ? (
          <StaggerGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((exercise) => (
              <StaggerItem key={exercise.id}>
                <Card
                  className={cn(
                    'h-full',
                    exercise.isCustom && 'cursor-pointer transition-colors hover:bg-muted/30',
                  )}
                  onClick={
                    exercise.isCustom
                      ? () => {
                          openEditExercise(exercise);
                        }
                      : undefined
                  }
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{exerciseDisplayName(exercise, locale)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {labelCategory(exercise.category)}
                      {exercise.isCustom ? ` · ${t('customBadge')}` : ''}
                      {exercise.isBodyweight ? ` · ${t('bodyweight')}` : ''}
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
