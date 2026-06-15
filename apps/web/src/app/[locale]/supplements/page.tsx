'use client';

import type { SupplementListItem, SupplementLogItem } from '@onemore/shared';
import { Button, Input } from '@onemore/ui';
import { ChevronLeft, ChevronRight, Pill, Plus, Settings } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { ScrollWheelPicker } from '@/components/scroll-wheel-picker';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { buildNumericWheelValues } from '@/lib/scroll-wheel-snap';
import {
  createSupplement,
  createSupplementLog,
  deleteSupplement,
  deleteSupplementLog,
  fetchSupplementLogs,
  fetchSupplements,
  updateSupplement,
  updateSupplementLog,
} from '@/lib/api-auth';

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function wheelValuesForUnit(unit: string): number[] {
  switch (unit) {
    case 'g':
      return buildNumericWheelValues(0, 200, 0.5);
    case 'mg':
      return buildNumericWheelValues(0, 2000, 50);
    case 'capsule':
      return buildNumericWheelValues(0, 20, 1);
    case 'scoop':
      return buildNumericWheelValues(0, 10, 0.5);
    case 'drops':
      return buildNumericWheelValues(0, 50, 1);
    default:
      return buildNumericWheelValues(0, 100, 1);
  }
}

export default function SupplementsPage(): React.ReactElement {
  const t = useTranslations('Supplements');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [date, setDate] = useState(() => todayDateString());
  const [items, setItems] = useState<SupplementListItem[]>([]);
  const [logs, setLogs] = useState<SupplementLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState<SupplementListItem['unit']>('g');
  const [editingItem, setEditingItem] = useState<SupplementListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplementListItem | null>(null);

  const [logTarget, setLogTarget] = useState<{
    supplement: SupplementListItem;
    existingLog: SupplementLogItem | null;
  } | null>(null);
  const [logWheelValue, setLogWheelValue] = useState(0);

  const selectedDate = useMemo(() => new Date(date + 'T12:00:00.000Z'), [date]);

  const logBySupplementId = useMemo(() => {
    const map = new Map<string, SupplementLogItem>();
    for (const log of logs) {
      map.set(log.supplementId, log);
    }
    return map;
  }, [logs]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [supplements, logsResponse] = await Promise.all([
        fetchSupplements(accessToken, locale),
        fetchSupplementLogs(accessToken, date, date, locale),
      ]);
      setItems(supplements);
      setLogs(logsResponse.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, locale, t, date]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function goTo(delta: number): void {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0] ?? '');
  }

  function resetForm(): void {
    setFormName('');
    setFormUnit('g');
  }

  function openEdit(item: SupplementListItem): void {
    setEditingItem(item);
    setFormName(item.name);
    setFormUnit(item.unit);
    setShowAddForm(true);
  }

  function closeForm(): void {
    setShowAddForm(false);
    setEditingItem(null);
    resetForm();
  }

  async function handleSaveSupplement(): Promise<void> {
    if (!accessToken) return;
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: { it: formName, en: formName },
        unit: formUnit,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
      if (editingItem) {
        await updateSupplement(accessToken, editingItem.id, payload);
      } else {
        await createSupplement(accessToken, payload);
      }
      closeForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSupplement(): Promise<void> {
    if (!accessToken || !deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await deleteSupplement(accessToken, deleteTarget.id);
      setDeleteTarget(null);
      closeForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setSaving(false);
    }
  }

  function openLog(supplement: SupplementListItem): void {
    const existing = logBySupplementId.get(supplement.id) ?? null;
    setLogTarget({ supplement, existingLog: existing });
    setLogWheelValue(existing?.amount ?? 0);
  }

  function closeLog(): void {
    setLogTarget(null);
  }

  async function handleSaveLog(): Promise<void> {
    if (!accessToken || !logTarget) return;
    if (logWheelValue <= 0 && !logTarget.existingLog) {
      closeLog();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (logWheelValue <= 0 && logTarget.existingLog) {
        await deleteSupplementLog(accessToken, logTarget.existingLog.id);
      } else if (logTarget.existingLog) {
        await updateSupplementLog(accessToken, logTarget.existingLog.id, {
          id: logTarget.existingLog.id,
          amount: logWheelValue,
        });
      } else {
        await createSupplementLog(accessToken, {
          supplementId: logTarget.supplement.id,
          amount: logWheelValue,
          notes: null,
          date: date + 'T00:00:00.000Z',
        });
      }
      closeLog();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(): Promise<void> {
    if (!accessToken || !logTarget?.existingLog) return;
    setSaving(true);
    setError(null);
    try {
      await deleteSupplementLog(accessToken, logTarget.existingLog.id);
      closeLog();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setSaving(false);
    }
  }

  const wheelValues = logTarget ? wheelValuesForUnit(logTarget.supplement.unit) : [];

  const wheelOptions = wheelValues.map((v) => ({
    value: v,
    label: v % 1 === 0 ? String(v) : v.toFixed(1),
  }));

  const headerActions = (
    <button
      aria-label={t('addTitle')}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gym-separator bg-gym-surface text-xl leading-none text-primary shadow-sm transition-transform active:scale-95"
      type="button"
      onClick={() => {
        setEditingItem(null);
        resetForm();
        setShowAddForm(true);
      }}
    >
      +
    </button>
  );

  const dateNav = (
    <div className="flex items-center justify-center gap-3">
      <button
        aria-label="Previous day"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors active:text-foreground"
        type="button"
        onClick={() => {
          goTo(-1);
        }}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <label className="flex items-center gap-1 text-sm font-medium">
        <input
          className="appearance-none bg-transparent text-center text-sm font-medium text-foreground outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          type="date"
          value={date}
          onChange={(e) => {
            const val = e.target.value;
            if (val) setDate(val);
          }}
        />
      </label>
      <button
        aria-label="Next day"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors active:text-foreground"
        type="button"
        onClick={() => {
          goTo(1);
        }}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        actionsLayout={isDesktop ? 'stacked' : 'inline'}
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={'Dashboard'}
        title={t('title')}
        variant="wide"
        actions={headerActions}
        onRefresh={isDesktop ? undefined : loadData}
      >
        {dateNav}

        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 6 : 4} columns="2" />
        ) : items.length === 0 ? (
          <GymEmptyState
            action={
              <Button
                className="min-h-11 w-full"
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  resetForm();
                  setShowAddForm(true);
                }}
              >
                {t('addTitle')}
              </Button>
            }
            icon={<Pill aria-hidden className="h-7 w-7" />}
            title={t('empty')}
            description={t('emptyDescription')}
          />
        ) : (
          <GymListGroup>
            {items.map((supplement) => {
              const log = logBySupplementId.get(supplement.id);
              return (
                <GymListRow
                  key={supplement.id}
                  title={supplement.name}
                  subtitle={supplement.unit}
                  trailing={
                    <div className="flex items-center gap-2">
                      <span className="min-w-[2ch] text-right tabular-nums text-muted-foreground">
                        {log ? String(log.amount) : '\u2014'}
                      </span>
                      <button
                        aria-label={t('logAmount')}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gym-separator text-muted-foreground transition-colors active:text-foreground"
                        type="button"
                        onClick={() => {
                          openLog(supplement);
                        }}
                      >
                        {log ? (
                          <span className="text-sm font-medium">{log.supplementUnit}</span>
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        aria-label={t('editTitle')}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors active:text-foreground"
                        type="button"
                        onClick={() => {
                          openEdit(supplement);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
              );
            })}
          </GymListGroup>
        )}

        <GymAdaptiveOverlay
          ariaLabel={editingItem ? t('editTitle') : t('addTitle')}
          open={showAddForm}
          tall
          title={editingItem ? t('editTitle') : t('addTitle')}
          onClose={closeForm}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {t('name')}
                  <Input
                    className="min-h-11"
                    placeholder="Creatina"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                    }}
                  />
                </label>
              </div>
              <div className="w-[80px] shrink-0">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {t('unit')}
                  <select
                    className="min-h-11 rounded-md border bg-background px-2 text-sm text-foreground"
                    value={formUnit}
                    onChange={(e) => {
                      setFormUnit(e.target.value as SupplementListItem['unit']);
                    }}
                  >
                    <option value="g">g</option>
                    <option value="mg">mg</option>
                    <option value="capsule">caps</option>
                    <option value="scoop">scoop</option>
                    <option value="drops">gocce</option>
                  </select>
                </label>
              </div>
            </div>
            {editingItem ? (
              <Button
                className="min-h-11 w-full"
                disabled={saving}
                type="button"
                variant="destructive"
                onClick={() => {
                  setDeleteTarget(editingItem);
                }}
              >
                {t('delete')}
              </Button>
            ) : null}
            <div className="flex gap-2">
              <Button
                className="min-h-11 flex-1"
                type="button"
                variant="outline"
                onClick={closeForm}
              >
                {t('cancel')}
              </Button>
              <Button
                className="min-h-11 flex-1"
                disabled={saving || !formName.trim()}
                type="button"
                onClick={() => {
                  void handleSaveSupplement();
                }}
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </GymAdaptiveOverlay>

        <GymAdaptiveOverlay
          ariaLabel={t('logAmount')}
          open={logTarget !== null}
          title={logTarget ? logTarget.supplement.name : t('logAmount')}
          onClose={closeLog}
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground">{logTarget?.supplement.unit}</p>
            <ScrollWheelPicker
              label=""
              options={wheelOptions}
              showLabel={false}
              value={logWheelValue}
              onChange={(v) => {
                setLogWheelValue(v);
              }}
            />
            {logTarget?.existingLog ? (
              <Button
                className="min-h-11 w-full"
                disabled={saving}
                type="button"
                variant="destructive"
                onClick={() => {
                  void handleDeleteLog();
                }}
              >
                {t('deleteLog')}
              </Button>
            ) : null}
            <div className="flex w-full gap-2">
              <Button
                className="min-h-11 flex-1"
                disabled={saving}
                type="button"
                variant="outline"
                onClick={closeLog}
              >
                {t('cancel')}
              </Button>
              <Button
                className="min-h-11 flex-1"
                disabled={saving || (logWheelValue <= 0 && !logTarget?.existingLog)}
                type="button"
                onClick={() => {
                  void handleSaveLog();
                }}
              >
                {logWheelValue > 0 || !logTarget?.existingLog ? t('save') : t('deleteLog')}
              </Button>
            </div>
          </div>
        </GymAdaptiveOverlay>

        <GymActionSheet
          cancelLabel={t('cancel')}
          confirmLabel={t('delete')}
          destructive
          loading={saving}
          open={deleteTarget !== null}
          title={t('deleteConfirm')}
          onCancel={() => {
            setDeleteTarget(null);
          }}
          onConfirm={() => {
            void handleDeleteSupplement();
          }}
        />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
