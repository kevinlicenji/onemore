'use client';

import type { SupplementListItem, SupplementLogItem } from '@onemore/shared';
import { Button, Input } from '@onemore/ui';
import { Pill, Plus, Settings } from 'lucide-react';
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
import { SupplementCalendar } from '@/components/supplement-calendar';
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
  fetchSupplementTrend,
  repeatYesterdaySupplements,
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
  const [logDates, setLogDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const trendDays = 60;

  const [showManageForm, setShowManageForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState<SupplementListItem['unit']>('g');
  const [editingItem, setEditingItem] = useState<SupplementListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplementListItem | null>(null);

  const [logTarget, setLogTarget] = useState<{
    supplement: SupplementListItem;
    existingLog: SupplementLogItem | null;
  } | null>(null);
  const [logWheelValue, setLogWheelValue] = useState(0);
  const [showUnlogged, setShowUnlogged] = useState(false);
  const [trendItems, setTrendItems] = useState<{ date: string; name: string; amount: number }[]>(
    [],
  );

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [quickAddStep, setQuickAddStep] = useState<'select' | 'amount'>('select');
  const [quickAddSupplement, setQuickAddSupplement] = useState<SupplementListItem | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState(0);

  const [yesterdayRepeatable, setYesterdayRepeatable] = useState(false);
  const [savingRepeat, setSavingRepeat] = useState(false);

  const recentlyLoggedNames = useMemo(() => {
    return new Set(trendItems.map((t) => t.name));
  }, [trendItems]);

  useEffect(() => {
    setShowUnlogged(false);
  }, [date]);

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
      const [supplements, logsResponse, trend] = await Promise.all([
        fetchSupplements(accessToken, locale),
        fetchSupplementLogs(accessToken, date, date, locale),
        fetchSupplementTrend(accessToken, trendDays, locale),
      ]);
      setItems(supplements);
      setLogs(logsResponse.logs);
      setLogDates(new Set(trend.filter((d) => d.hasLogged).map((d) => d.date)));
      setTrendItems(
        trend.flatMap((d) =>
          d.items.map((item) => ({ date: d.date, name: item.name, amount: item.amount })),
        ),
      );

      const isToday = date === todayDateString();
      if (isToday && logsResponse.logs.length === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0] ?? '';
        const hasYesterdayLogs = trend.some((d) => d.date === yesterdayStr && d.hasLogged);
        setYesterdayRepeatable(hasYesterdayLogs);
      } else {
        setYesterdayRepeatable(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, locale, t, date, trendDays]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm(): void {
    setFormName('');
    setFormUnit('g');
  }

  function openManage(supplement?: SupplementListItem): void {
    if (supplement) {
      setEditingItem(supplement);
      setFormName(supplement.name);
      setFormUnit(supplement.unit);
    } else {
      setEditingItem(null);
      resetForm();
    }
    setShowManageForm(true);
  }

  function closeManageForm(): void {
    setShowManageForm(false);
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
      closeManageForm();
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
      closeManageForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setSaving(false);
    }
  }

  function openLog(supplement: SupplementListItem): void {
    const existing = logBySupplementId.get(supplement.id) ?? null;
    let defaultAmount = existing?.amount ?? 0;
    if (!existing) {
      const previous = trendItems
        .filter((t) => t.name === supplement.name && t.date < date)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (previous.length > 0) {
        defaultAmount = previous[0]?.amount ?? 0;
      }
    }
    setLogTarget({ supplement, existingLog: existing });
    setLogWheelValue(defaultAmount);
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

  async function handleRepeatYesterday(): Promise<void> {
    if (!accessToken) return;
    setSavingRepeat(true);
    setError(null);
    try {
      await repeatYesterdaySupplements(accessToken, date + 'T00:00:00.000Z');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setSavingRepeat(false);
    }
  }

  const quickAddFiltered = useMemo(() => {
    if (!quickAddSearch.trim()) return items;
    const q = quickAddSearch.toLowerCase();
    return items.filter((s) => s.name.toLowerCase().includes(q));
  }, [items, quickAddSearch]);

  function openQuickAdd(): void {
    setQuickAddSearch('');
    setQuickAddStep('select');
    setQuickAddSupplement(null);
    setQuickAddAmount(0);
    setQuickAddOpen(true);
  }

  function selectQuickAddSupplement(supplement: SupplementListItem): void {
    const previous = trendItems
      .filter((t) => t.name === supplement.name && t.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    const defaultAmount = previous.length > 0 ? (previous[0]?.amount ?? 0) : 0;
    setQuickAddSupplement(supplement);
    setQuickAddAmount(defaultAmount);
    setQuickAddStep('amount');
  }

  async function handleQuickAddSave(): Promise<void> {
    if (!accessToken || !quickAddSupplement) return;
    if (quickAddAmount <= 0) {
      setQuickAddOpen(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createSupplementLog(accessToken, {
        supplementId: quickAddSupplement.id,
        amount: quickAddAmount,
        notes: null,
        date: date + 'T00:00:00.000Z',
      });
      setQuickAddOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setSaving(false);
    }
  }

  const wheelValues = logTarget
    ? wheelValuesForUnit(logTarget.supplement.unit)
    : quickAddSupplement
      ? wheelValuesForUnit(quickAddSupplement.unit)
      : [];

  const wheelOptions = wheelValues.map((v) => ({
    value: v,
    label: v % 1 === 0 ? String(v) : v.toFixed(1),
  }));

  const headerActions = isDesktop ? (
    <div className="flex items-center gap-2">
      <Button className="min-h-9 gap-1.5" size="sm" type="button" onClick={openQuickAdd}>
        <Plus className="h-4 w-4" />
        {t('quickAdd')}
      </Button>
      <button
        aria-label={t('manageSupplements')}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gym-separator text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => {
          openManage();
        }}
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <button
        aria-label={t('quickAdd')}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gym-separator bg-gym-surface text-xl leading-none text-primary shadow-sm transition-transform active:scale-95"
        type="button"
        onClick={openQuickAdd}
      >
        +
      </button>
      <button
        aria-label={t('manageSupplements')}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors active:text-foreground"
        type="button"
        onClick={() => {
          openManage();
        }}
      >
        <Settings className="h-5 w-5" />
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
        <div className={isDesktop ? 'flex gap-6' : 'flex flex-col gap-4'}>
          {isDesktop ? (
            <>
              <div className="w-80 shrink-0">
                <SupplementCalendar
                  locale={locale}
                  logDates={logDates}
                  selectedDate={date}
                  onSelectDate={setDate}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-4">{renderSupplementList()}</div>
              </div>
            </>
          ) : (
            <>
              <SupplementCalendar
                locale={locale}
                logDates={logDates}
                selectedDate={date}
                onSelectDate={setDate}
              />
              {renderSupplementList()}
            </>
          )}
        </div>
      </AdaptivePageShell>

      {renderLogOverlay()}
      {renderManageForm()}
      {renderDeleteConfirm()}
      {renderQuickAdd()}
    </RequireAuth>
  );

  function renderSupplementList(): React.ReactElement {
    const loggedItems = items.filter(
      (s) => recentlyLoggedNames.has(s.name) || logBySupplementId.has(s.id),
    );
    const unloggedItems = items.filter(
      (s) => !recentlyLoggedNames.has(s.name) && !logBySupplementId.has(s.id),
    );
    const visibleItems = showUnlogged ? items : loggedItems;

    return (
      <>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 6 : 4} columns="2" />
        ) : items.length === 0 ? (
          <GymEmptyState
            action={
              <Button
                className="min-h-11 w-full"
                type="button"
                onClick={() => {
                  openManage();
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
          <div className="flex flex-col gap-3">
            {yesterdayRepeatable && (
              <Button
                className="min-h-9 w-full gap-1.5 text-xs"
                disabled={savingRepeat}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => {
                  void handleRepeatYesterday();
                }}
              >
                {t('repeatYesterday')}
              </Button>
            )}

            <GymListGroup>
              {visibleItems.map((supplement) => {
                const log = logBySupplementId.get(supplement.id);
                return (
                  <GymListRow
                    key={supplement.id}
                    title={supplement.name}
                    onClick={() => {
                      openLog(supplement);
                    }}
                    trailing={
                      <span className="tabular-nums text-muted-foreground">
                        {log ? String(log.amount) + ' ' + log.supplementUnit : ''}
                      </span>
                    }
                  />
                );
              })}
            </GymListGroup>

            {unloggedItems.length > 0 && !showUnlogged ? (
              <Button
                className="min-h-10 w-full gap-1.5 text-xs"
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUnlogged(true);
                }}
              >
                + {t('addTitle')} ({unloggedItems.length})
              </Button>
            ) : null}
          </div>
        )}
      </>
    );
  }

  function renderLogOverlay(): React.ReactElement {
    return (
      <GymAdaptiveOverlay
        ariaLabel={t('logAmount')}
        open={logTarget !== null}
        title={logTarget ? logTarget.supplement.name : t('logAmount')}
        onClose={closeLog}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3">
            <ScrollWheelPicker
              label=""
              options={wheelOptions}
              showLabel={false}
              size="workout"
              value={logWheelValue}
              onChange={(v) => {
                setLogWheelValue(v);
              }}
            />
            <span className="text-sm text-muted-foreground">{logTarget?.supplement.unit}</span>
          </div>
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
    );
  }

  function renderManageForm(): React.ReactElement {
    return (
      <GymAdaptiveOverlay
        ariaLabel={editingItem ? t('editTitle') : t('manageSupplements')}
        open={showManageForm}
        tall
        title={editingItem ? t('editTitle') : t('manageSupplements')}
        onClose={closeManageForm}
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
              onClick={closeManageForm}
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
    );
  }

  function renderDeleteConfirm(): React.ReactElement {
    return (
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
    );
  }

  function renderQuickAdd(): React.ReactElement {
    return (
      <GymAdaptiveOverlay
        ariaLabel={t('quickAdd')}
        open={quickAddOpen}
        tall
        title={quickAddStep === 'select' ? t('quickAdd') : (quickAddSupplement?.name ?? '')}
        onClose={() => {
          setQuickAddOpen(false);
        }}
      >
        {quickAddStep === 'select' ? (
          <div className="flex flex-col gap-3">
            <Input
              autoFocus
              className="min-h-11"
              placeholder={t('searchSupplement')}
              value={quickAddSearch}
              onChange={(e) => {
                setQuickAddSearch(e.target.value);
              }}
            />
            <div className="flex max-h-80 flex-col overflow-y-auto">
              {quickAddFiltered.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">{t('empty')}</p>
              ) : (
                quickAddFiltered.map((supplement) => (
                  <button
                    key={supplement.id}
                    className="flex min-h-11 items-center gap-2 border-b border-gym-separator px-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
                    type="button"
                    onClick={() => {
                      selectQuickAddSupplement(supplement);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{supplement.name}</p>
                      <p className="text-xs text-muted-foreground">{supplement.unit}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-3">
              <ScrollWheelPicker
                label=""
                options={wheelOptions}
                showLabel={false}
                size="workout"
                value={quickAddAmount}
                onChange={(v) => {
                  setQuickAddAmount(v);
                }}
              />
              <span className="text-sm text-muted-foreground">{quickAddSupplement?.unit}</span>
            </div>
            <div className="flex w-full gap-2">
              <Button
                className="min-h-11 flex-1"
                type="button"
                variant="outline"
                onClick={() => {
                  setQuickAddStep('select');
                  setQuickAddSupplement(null);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                className="min-h-11 flex-1"
                disabled={saving || quickAddAmount <= 0}
                type="button"
                onClick={() => {
                  void handleQuickAddSave();
                }}
              >
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </GymAdaptiveOverlay>
    );
  }
}
