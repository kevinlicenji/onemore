'use client';

import type {
  AdminCreateSystemExercise,
  AdminSystemExercise,
  AdminUpdateSystemExercise,
  MuscleGroup,
} from '@onemore/shared';
import { EQUIPMENT_TYPES, FILTER_EXERCISE_CATEGORIES } from '@onemore/shared';
import { Button, Input } from '@onemore/ui';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { GymPickerField } from '@/components/gym-ui/gym-picker-field';
import { MuscleTagPicker } from '@/components/muscle-tag-picker';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAdmin } from '@/components/require-admin';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  createAdminExercise,
  deleteAdminExercise,
  fetchAdminExercises,
  updateAdminExercise,
} from '@/lib/admin-api';

const emptyForm: AdminCreateSystemExercise = {
  slug: '',
  names: { en: '', it: '' },
  description: { en: '', it: '' },
  category: 'chest',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  isBodyweight: false,
};

function exerciseLabel(exercise: AdminSystemExercise, locale: string): string {
  if (locale === 'it' && exercise.names.it) {
    return exercise.names.it;
  }
  return exercise.names.en;
}

export default function AdminExercisesPage(): React.ReactElement {
  const t = useTranslations('Admin');
  const tExercises = useTranslations('Exercises');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [items, setItems] = useState<AdminSystemExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSystemExercise | null>(null);
  const [form, setForm] = useState<AdminCreateSystemExercise>(emptyForm);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const exercises = await fetchAdminExercises(accessToken);
      setItems(exercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = showHidden ? items : items.filter((item) => item.deletedAt === null);

  function openCreate(): void {
    setEditing(null);
    setForm(emptyForm);
    setEditorOpen(true);
  }

  function openEdit(exercise: AdminSystemExercise): void {
    setEditing(exercise);
    setForm({
      slug: exercise.slug,
      names: exercise.names,
      description: exercise.description ?? { en: '', it: '' },
      category: exercise.category,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      equipment: exercise.equipment,
      isBodyweight: exercise.isBodyweight,
      wgerId: exercise.wgerId ?? undefined,
    });
    setEditorOpen(true);
  }

  async function handleSave(): Promise<void> {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const payload: AdminUpdateSystemExercise = {
          names: form.names,
          description: form.description,
          category: form.category,
          primaryMuscles: form.primaryMuscles,
          secondaryMuscles: form.secondaryMuscles,
          equipment: form.equipment,
          isBodyweight: form.isBodyweight,
          wgerId: form.wgerId,
        };
        await updateAdminExercise(accessToken, editing.id, payload);
      } else {
        await createAdminExercise(accessToken, form);
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleHide(exercise: AdminSystemExercise): Promise<void> {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await deleteAdminExercise(accessToken, exercise.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hideError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(exercise: AdminSystemExercise): Promise<void> {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAdminExercise(accessToken, exercise.id, {
        names: exercise.names,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('restoreError'));
    } finally {
      setSaving(false);
    }
  }

  const labelEquipment = useCallback(
    (value: string): string => {
      const knownLabels = [...EQUIPMENT_TYPES] as string[];
      if (knownLabels.includes(value)) {
        return tExercises(`equipmentLabels.${value}` as 'equipmentLabels.barbell');
      }
      return value.replace(/_/g, ' ');
    },
    [tExercises],
  );

  const categoryOptions = FILTER_EXERCISE_CATEGORIES.map((value) => ({
    value,
    label: (FILTER_EXERCISE_CATEGORIES as readonly string[]).includes(value)
      ? tExercises(`categories.${value}` as 'categories.chest')
      : value,
  }));

  const equipmentOptions = EQUIPMENT_TYPES.map((value) => ({
    value,
    label: labelEquipment(value),
  }));

  const editorBody = (
    <div className="flex flex-col gap-4 p-4">
      {!editing ? (
        <label className="flex flex-col gap-1 text-sm">
          {t('slug')}
          <Input
            value={form.slug}
            onChange={(e) => {
              setForm({ ...form, slug: e.target.value.toLowerCase() });
            }}
          />
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('slug')}: <span className="font-mono text-foreground">{editing.slug}</span>
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {tExercises('nameEn')}
        <Input
          value={form.names.en}
          onChange={(e) => {
            setForm({ ...form, names: { ...form.names, en: e.target.value } });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {tExercises('nameIt')}
        <Input
          value={form.names.it ?? ''}
          onChange={(e) => {
            setForm({ ...form, names: { ...form.names, it: e.target.value } });
          }}
        />
      </label>
      <GymPickerField
        label={tExercises('primaryMuscle')}
        options={categoryOptions}
        value={form.category}
        onChange={(value) => {
          setForm({ ...form, category: value });
        }}
      />
      <MuscleTagPicker
        maxTags={3}
        value={form.primaryMuscles as MuscleGroup[]}
        onChange={(tags) => {
          setForm({ ...form, primaryMuscles: tags });
        }}
      />
      <GymPickerField
        label={tExercises('equipmentField')}
        options={equipmentOptions}
        value={form.equipment}
        onChange={(value) => {
          setForm({ ...form, equipment: value });
        }}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={form.isBodyweight}
          type="checkbox"
          onChange={(e) => {
            setForm({ ...form, isBodyweight: e.target.checked });
          }}
        />
        {tExercises('bodyweight')}
      </label>
      <div className="flex gap-2">
        <Button disabled={saving} type="button" onClick={() => void handleSave()}>
          {t('save')}
        </Button>
        <Button
          disabled={saving}
          type="button"
          variant="outline"
          onClick={() => {
            setEditorOpen(false);
          }}
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <RequireAdmin>
      <AdaptivePageShell
        actions={
          <Button disabled={saving} type="button" onClick={openCreate}>
            {t('addExercise')}
          </Button>
        }
        backHref={`/${locale}/admin`}
        backLabel={t('backToAdmin')}
        description={t('exercisesSubtitle')}
        title={t('exercisesTitle')}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            checked={showHidden}
            type="checkbox"
            onChange={(e) => {
              setShowHidden(e.target.checked);
            }}
          />
          {t('showHidden')}
        </label>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : visibleItems.length === 0 ? (
          <GymEmptyState
            icon={<Dumbbell aria-hidden className="h-7 w-7" />}
            title={t('exercisesEmpty')}
          />
        ) : (
          <GymListGroup>
            {visibleItems.map((exercise) => (
              <GymListRow
                key={exercise.id}
                showChevron={false}
                subtitle={
                  exercise.deletedAt ? t('hiddenBadge') : `${exercise.slug} · ${exercise.category}`
                }
                title={exerciseLabel(exercise, locale)}
                trailing={
                  <div className="flex gap-2">
                    <Button
                      disabled={saving}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        openEdit(exercise);
                      }}
                    >
                      {t('edit')}
                    </Button>
                    {exercise.deletedAt ? (
                      <Button
                        disabled={saving}
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          void handleRestore(exercise);
                        }}
                      >
                        {t('restore')}
                      </Button>
                    ) : (
                      <Button
                        disabled={saving}
                        size="sm"
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          void handleHide(exercise);
                        }}
                      >
                        {t('hide')}
                      </Button>
                    )}
                  </div>
                }
              />
            ))}
          </GymListGroup>
        )}
        {!isDesktop ? (
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin`}>{t('backToAdmin')}</Link>
            </Button>
          </div>
        ) : null}
      </AdaptivePageShell>

      <GymAdaptiveOverlay
        ariaLabel={editing ? t('editExercise') : t('addExercise')}
        open={editorOpen}
        title={editing ? t('editExercise') : t('addExercise')}
        onClose={() => {
          setEditorOpen(false);
        }}
      >
        {editorBody}
      </GymAdaptiveOverlay>
    </RequireAdmin>
  );
}
