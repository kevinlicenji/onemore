'use client';

import type {
  CreateSupplementLogInput,
  SupplementListItem,
  SupplementLogItem,
} from '@onemore/shared';
import { Button, Card, CardContent, Input } from '@onemore/ui';
import { Pill, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { GymSearchField } from '@/components/gym-ui/gym-search-field';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  createSupplement,
  createSupplementLog,
  deleteSupplement,
  deleteSupplementLog,
  fetchSupplements,
  fetchTodaySupplements,
  repeatYesterdaySupplements,
  updateSupplement,
} from '@/lib/api-auth';

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

export default function SupplementsPage(): React.ReactElement {
  const t = useTranslations('Supplements');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [items, setItems] = useState<SupplementListItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<SupplementLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplementListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplementListItem | null>(null);
  const [logTarget, setLogTarget] = useState<SupplementListItem | null>(null);
  const [logAmount, setLogAmount] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState<SupplementListItem['unit']>('g');

  const filteredItems = search.trim()
    ? items.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const loadData = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [supplements, today] = await Promise.all([
        fetchSupplements(accessToken, locale),
        fetchTodaySupplements(accessToken, locale),
      ]);
      setItems(supplements);
      setTodayLogs(today.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, locale, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loggedSupplementIds = new Set(todayLogs.map((l) => l.supplementId));

  function resetForm(): void {
    setFormName('');
    setFormUnit('g');
  }

  function openEdit(item: SupplementListItem): void {
    setEditingItem(item);
    setFormName(item.name);
    setFormUnit(item.unit);
  }

  function closeForm(): void {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  }

  async function handleSave(): Promise<void> {
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

  async function handleDelete(): Promise<void> {
    if (!accessToken || !deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await deleteSupplement(accessToken, deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleLog(): Promise<void> {
    if (!accessToken || !logTarget) return;
    const amount = Number(logAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const date = todayDateString();
      const payload: CreateSupplementLogInput = {
        supplementId: logTarget.id,
        amount,
        notes: logNotes.trim() || null,
        date: date + 'T00:00:00.000Z',
      };
      await createSupplementLog(accessToken, payload);
      setLogTarget(null);
      setLogAmount('');
      setLogNotes('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRepeatYesterday(): Promise<void> {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      await repeatYesterdaySupplements(accessToken, todayDateString() + 'T00:00:00.000Z');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveLog(logId: string): Promise<void> {
    if (!accessToken) return;
    try {
      await deleteSupplementLog(accessToken, logId);
      await loadData();
    } catch {
      // ignore
    }
  }

  const headerActions = (
    <button
      aria-label={t('addTitle')}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gym-separator bg-gym-surface text-xl leading-none text-primary shadow-sm transition-transform active:scale-95"
      type="button"
      onClick={() => {
        resetForm();
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

  const supplementListMobile = (
    <GymListGroup>
      {filteredItems.map((supplement) => (
        <GymListRow
          key={supplement.id}
          meta={
            <>
              <span className="tabular-nums">{supplement.recentLogCount}</span>
              <span className="mx-1">·</span>
              {supplement.isGlobal ? t('global') : t('custom')}
            </>
          }
          subtitle={supplement.unit}
          title={supplement.name}
          onClick={() => {
            openEdit(supplement);
          }}
        />
      ))}
    </GymListGroup>
  );

  const todaySection =
    todayLogs.length > 0 ? (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">{t('todayLogsTitle')}</h3>
          <button
            className="text-xs font-medium text-primary disabled:opacity-50"
            disabled={saving}
            type="button"
            onClick={() => {
              void handleRepeatYesterday();
            }}
          >
            {t('repeatYesterday')}
          </button>
        </div>
        <GymListGroup>
          {todayLogs.map((log) => (
            <GymListRow
              key={log.id}
              meta={String(log.amount) + ' ' + log.supplementUnit}
              subtitle={log.notes ?? undefined}
              title={log.supplementName}
              trailing={
                <button
                  aria-label={t('delete')}
                  className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors active:text-destructive"
                  type="button"
                  onClick={() => {
                    void handleRemoveLog(log.id);
                  }}
                >
                  ✕
                </button>
              }
            />
          ))}
        </GymListGroup>
      </div>
    ) : null;

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
        {searchField}

        {todaySection}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 6 : 4} columns="2" />
        ) : filteredItems.length === 0 ? (
          isDesktop ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <GymEmptyState
              action={
                <Button
                  className="min-h-11 w-full"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  {t('addTitle')}
                </Button>
              }
              icon={<Pill aria-hidden className="h-7 w-7" />}
              title={t('empty')}
              description={t('emptyDescription')}
            />
          )
        ) : isDesktop ? (
          <StaggerGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((supplement) => (
              <StaggerItem key={supplement.id}>
                <Card
                  className="h-full cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => {
                    openEdit(supplement);
                  }}
                >
                  <CardContent className="flex flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{supplement.name}</p>
                        {!loggedSupplementIds.has(supplement.id) ? (
                          <button
                            aria-label={t('logAmount')}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform active:scale-95"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogTarget(supplement);
                              setLogAmount('');
                              setLogNotes('');
                            }}
                          >
                            <Plus aria-hidden className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md border border-gym-separator bg-background px-1.5 py-0.5 font-medium">
                        {supplement.unit}
                      </span>
                      <span>{supplement.isGlobal ? t('global') : t('custom')}</span>
                      <span className="ml-auto tabular-nums">
                        {supplement.recentLogCount}{' '}
                        {supplement.recentLogCount === 1 ? 'log' : 'logs'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <StaggerGroup compact>
            <StaggerItem>{supplementListMobile}</StaggerItem>
          </StaggerGroup>
        )}

        <GymAdaptiveOverlay
          ariaLabel={editingItem ? t('editTitle') : t('addTitle')}
          open={showForm || editingItem !== null}
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
                  void handleSave();
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
          title={logTarget ? logTarget.name : t('logAmount')}
          onClose={() => {
            setLogTarget(null);
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t('logAmount')} ({logTarget?.unit})
              <Input
                className="min-h-11"
                inputMode="decimal"
                min={0}
                placeholder="5"
                step="any"
                type="number"
                value={logAmount}
                onChange={(e) => {
                  setLogAmount(e.target.value);
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t('logNotes')}
              <Input
                className="min-h-11"
                placeholder={t('logPlaceholder')}
                value={logNotes}
                onChange={(e) => {
                  setLogNotes(e.target.value);
                }}
              />
            </label>
            <div className="flex gap-2">
              <Button
                className="min-h-11 flex-1"
                type="button"
                variant="outline"
                onClick={() => {
                  setLogTarget(null);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                className="min-h-11 flex-1"
                disabled={saving || !logAmount || Number(logAmount) <= 0}
                type="button"
                onClick={() => {
                  void handleLog();
                }}
              >
                {saving ? t('logging') : t('save')}
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
            void handleDelete();
          }}
        />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
