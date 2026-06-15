'use client';

import type {
  AdminCreateSupplement,
  AdminSupplement,
  AdminUpdateSupplement,
} from '@onemore/shared';
import { Button, Input } from '@onemore/ui';
import { Pill } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAdmin } from '@/components/require-admin';
import {
  createAdminSupplement,
  deleteAdminSupplement,
  fetchAdminSupplements,
  updateAdminSupplement,
} from '@/lib/admin-api';

const emptyForm: AdminCreateSupplement = {
  nameIt: '',
  nameEn: '',
  unit: 'g',
};

function supplementLabel(supplement: AdminSupplement, locale: string): string {
  return locale === 'it' ? supplement.name.it : supplement.name.en;
}

export default function AdminSupplementsPage(): React.ReactElement {
  const t = useTranslations('Admin');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const [items, setItems] = useState<AdminSupplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSupplement | null>(null);
  const [form, setForm] = useState<AdminCreateSupplement>(emptyForm);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const supplements = await fetchAdminSupplements(accessToken);
      setItems(supplements);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = items;

  function openCreate(): void {
    setEditing(null);
    setForm(emptyForm);
    setEditorOpen(true);
  }

  function openEdit(supplement: AdminSupplement): void {
    setEditing(supplement);
    setForm({
      nameIt: supplement.name.it,
      nameEn: supplement.name.en,
      unit: supplement.unit,
    });
    setEditorOpen(true);
  }

  async function handleSave(): Promise<void> {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const payload: AdminUpdateSupplement = {};
        if (form.nameIt !== editing.name.it) payload.nameIt = form.nameIt;
        if (form.nameEn !== editing.name.en) payload.nameEn = form.nameEn;
        if (form.unit !== editing.unit) payload.unit = form.unit;
        await updateAdminSupplement(accessToken, editing.id, payload);
      } else {
        await createAdminSupplement(accessToken, form);
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplement: AdminSupplement): Promise<void> {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      await deleteAdminSupplement(accessToken, supplement.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  const editorBody = (
    <div className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1 text-sm">
        {t('supplementNameIt')}
        <Input
          value={form.nameIt}
          onChange={(e) => {
            setForm({ ...form, nameIt: e.target.value });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('supplementNameEn')}
        <Input
          value={form.nameEn}
          onChange={(e) => {
            setForm({ ...form, nameEn: e.target.value });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('supplementUnit')}
        <select
          className="min-h-11 rounded-md border bg-background px-2 text-sm text-foreground"
          value={form.unit}
          onChange={(e) => {
            setForm({
              ...form,
              unit: e.target.value as 'g' | 'mg' | 'capsule' | 'scoop' | 'drops',
            });
          }}
        >
          <option value="g">g</option>
          <option value="mg">mg</option>
          <option value="capsule">capsule</option>
          <option value="scoop">scoop</option>
          <option value="drops">gocce</option>
        </select>
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
            {t('addSupplement')}
          </Button>
        }
        backHref={`/${locale}/admin`}
        backLabel={t('backToAdmin')}
        description={t('supplementsSubtitle')}
        title={t('supplementsTitle')}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : visibleItems.length === 0 ? (
          <GymEmptyState
            icon={<Pill aria-hidden className="h-7 w-7" />}
            title={t('supplementsEmpty')}
          />
        ) : (
          <GymListGroup>
            {visibleItems.map((supplement) => (
              <GymListRow
                key={supplement.id}
                showChevron={false}
                subtitle={supplement.name.it + ' · ' + supplement.unit}
                title={supplementLabel(supplement, locale)}
                trailing={
                  <div className="flex gap-2">
                    <Button
                      disabled={saving}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        openEdit(supplement);
                      }}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      disabled={saving}
                      size="sm"
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        void handleDelete(supplement);
                      }}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                }
              />
            ))}
          </GymListGroup>
        )}
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href={`/${locale}/admin`}>{t('backToAdmin')}</Link>
          </Button>
        </div>
      </AdaptivePageShell>

      <GymAdaptiveOverlay
        ariaLabel={editing ? t('editSupplement') : t('addSupplement')}
        open={editorOpen}
        title={editing ? t('editSupplement') : t('addSupplement')}
        onClose={() => {
          setEditorOpen(false);
        }}
      >
        {editorBody}
      </GymAdaptiveOverlay>
    </RequireAdmin>
  );
}
