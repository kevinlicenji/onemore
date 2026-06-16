'use client';

import type { MaxHistoryLogWithExercise, UserExerciseMaxWithExercise } from '@onemore/shared';
import { Button, Input } from '@onemore/ui';
import { Dumbbell } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ExerciseSearchCombobox } from '@/components/exercise-search-combobox';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  fetchMaxValues,
  fetchPendingMaxValues,
  insertManualMaxValue,
  resolvePendingMaxValue,
} from '@/lib/api-auth';
import { getExerciseDisplayName } from '@/lib/exercise-display-name';

export default function MaxValuesPage(): React.ReactElement {
  const t = useTranslations('MaxValues');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [active, setActive] = useState<UserExerciseMaxWithExercise[]>([]);
  const [pending, setPending] = useState<MaxHistoryLogWithExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [manualExerciseId, setManualExerciseId] = useState<string | null>(null);
  const [manualExerciseName, setManualExerciseName] = useState('');
  const [manualWeight, setManualWeight] = useState('');

  const loadData = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [maxValues, pendingItems] = await Promise.all([
        fetchMaxValues(accessToken),
        fetchPendingMaxValues(accessToken),
      ]);
      setActive(maxValues);
      setPending(pendingItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleResolve(logId: string, action: 'APPROVE' | 'REJECT'): Promise<void> {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    try {
      await resolvePendingMaxValue(accessToken, logId, { action });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resolveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSave(): Promise<void> {
    if (!accessToken || !manualExerciseId) {
      return;
    }
    const weight = Number.parseFloat(manualWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      setError(t('invalidWeight'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await insertManualMaxValue(accessToken, {
        exerciseId: manualExerciseId,
        weight,
      });
      setManualExerciseId(null);
      setManualExerciseName('');
      setManualWeight('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth>
      <AdaptivePageShell description={t('subtitle')} title={t('title')}>
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className={isDesktop ? 'grid gap-6 lg:grid-cols-2' : 'flex flex-col gap-6'}>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {pending.length > 0 ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('pendingTitle')}
                </h2>
                <GymListGroup>
                  {pending.map((item) => (
                    <GymListRow
                      key={item.id}
                      subtitle={t('pendingDetail', {
                        weight: item.weight,
                        reps: item.reps,
                        e1rm: item.calculated1RM,
                      })}
                      title={getExerciseDisplayName({ names: item.exercise.names }, locale)}
                      trailing={
                        <div className="flex gap-2">
                          <Button
                            disabled={saving}
                            size="sm"
                            type="button"
                            onClick={() => {
                              void handleResolve(item.id, 'APPROVE');
                            }}
                          >
                            {t('approve')}
                          </Button>
                          <Button
                            disabled={saving}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              void handleResolve(item.id, 'REJECT');
                            }}
                          >
                            {t('reject')}
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </GymListGroup>
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('activeTitle')}
              </h2>
              {active.length === 0 ? (
                <GymEmptyState
                  description={t('emptyActive')}
                  icon={<Dumbbell aria-hidden className="h-6 w-6" />}
                  title={t('emptyActiveTitle')}
                />
              ) : (
                <GymListGroup>
                  {active.map((item) => (
                    <GymListRow
                      key={item.id}
                      subtitle={
                        item.source === 'MANUAL' ? t('sourceManual') : t('sourceApproved')
                      }
                      title={getExerciseDisplayName({ names: item.exercise.names }, locale)}
                      trailing={
                        <span className="text-sm font-semibold tabular-nums">{item.weight} kg</span>
                      }
                    />
                  ))}
                </GymListGroup>
              )}
            </section>

            <section className="rounded-2xl border border-gym-separator bg-gym-surface p-4">
              <h2 className="text-sm font-semibold">{t('manualTitle')}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t('manualHint')}</p>
              <div className="mt-4 flex flex-col gap-3">
                {accessToken ? (
                  <ExerciseSearchCombobox
                    accessToken={accessToken}
                    disabled={saving}
                    locale={locale}
                    noResultsLabel={t('searchNoResults')}
                    placeholder={t('searchExercise')}
                    searchingLabel={t('searching')}
                    showMuscleFilter={false}
                    onSelect={(exercise) => {
                      setManualExerciseId(exercise.id);
                      setManualExerciseName(getExerciseDisplayName({ names: exercise.names }, locale));
                    }}
                  />
                ) : null}
                {manualExerciseName ? (
                  <p className="text-sm text-muted-foreground">
                    {t('selectedExercise', { name: manualExerciseName })}
                  </p>
                ) : null}
                <Input
                  disabled={saving}
                  inputMode="decimal"
                  placeholder={t('weightPlaceholder')}
                  type="number"
                  value={manualWeight}
                  onChange={(event) => {
                    setManualWeight(event.target.value);
                  }}
                />
                <Button
                  disabled={saving || !manualExerciseId || manualWeight.trim().length === 0}
                  type="button"
                  onClick={() => {
                    void handleManualSave();
                  }}
                >
                  {t('saveManual')}
                </Button>
              </div>
            </section>
          </div>
        )}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
