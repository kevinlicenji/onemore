'use client';

import type { AdminTemplateListItem } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAdmin } from '@/components/require-admin';
import { ThemedTextInput } from '@/components/themed-text-input';
import {
  deleteAdminTemplate,
  duplicateAdminTemplate,
  fetchAdminTemplates,
  publishAdminTemplate,
} from '@/lib/admin-api';

export default function AdminTemplatesPage(): React.ReactElement {
  const t = useTranslations('Admin');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [items, setItems] = useState<AdminTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<AdminTemplateListItem | null>(null);
  const [duplicateSlug, setDuplicateSlug] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const templates = await fetchAdminTemplates(accessToken);
      setItems(templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish(template: AdminTemplateListItem): Promise<void> {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await publishAdminTemplate(accessToken, template.slug);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('publishError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleHide(template: AdminTemplateListItem): Promise<void> {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await deleteAdminTemplate(accessToken, template.slug);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hideError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(): Promise<void> {
    if (!accessToken || !duplicateSource || duplicateSlug.trim().length === 0) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await duplicateAdminTemplate(accessToken, duplicateSource.slug, {
        slug: duplicateSlug.trim().toLowerCase(),
      });
      setDuplicateSource(null);
      setDuplicateSlug('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('duplicateError'));
    } finally {
      setSaving(false);
    }
  }

  function statusLabel(template: AdminTemplateListItem): string {
    if (template.deletedAt) {
      return t('hiddenBadge');
    }
    if (template.latestVersionStatus === 'draft') {
      return t('statusDraft');
    }
    if (template.hasPublishedVersion) {
      return t('statusPublished');
    }
    return t('statusUnknown');
  }

  return (
    <RequireAdmin>
      <AdaptivePageShell
        actions={
          <Button asChild>
            <Link href={`/${locale}/admin/templates/new`}>{t('addTemplate')}</Link>
          </Button>
        }
        backHref={`/${locale}/admin`}
        backLabel={t('backToAdmin')}
        description={t('templatesSubtitle')}
        title={t('templatesTitle')}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : items.length === 0 ? (
          <GymEmptyState
            icon={<LayoutTemplate aria-hidden className="h-7 w-7" />}
            title={t('templatesEmpty')}
          />
        ) : (
          <GymListGroup>
            {items.map((template) => (
              <GymListRow
                key={template.id}
                showChevron={false}
                subtitle={`${template.slug} · ${statusLabel(template)} · ${String(template.daysCount)}d`}
                title={template.displayName}
                trailing={
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      disabled={saving}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        router.push(`/${locale}/admin/templates/${template.slug}/edit`);
                      }}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      disabled={saving}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDuplicateSource(template);
                        setDuplicateSlug(`${template.slug}-copy`);
                      }}
                    >
                      {t('duplicate')}
                    </Button>
                    {template.latestVersionStatus === 'draft' && !template.deletedAt ? (
                      <Button
                        disabled={saving}
                        size="sm"
                        type="button"
                        onClick={() => {
                          void handlePublish(template);
                        }}
                      >
                        {t('publish')}
                      </Button>
                    ) : null}
                    {!template.deletedAt ? (
                      <Button
                        disabled={saving}
                        size="sm"
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          void handleHide(template);
                        }}
                      >
                        {t('hide')}
                      </Button>
                    ) : null}
                  </div>
                }
              />
            ))}
          </GymListGroup>
        )}
      </AdaptivePageShell>

      <GymAdaptiveOverlay
        ariaLabel={t('duplicateTemplate')}
        open={duplicateSource !== null}
        title={t('duplicateTemplate')}
        onClose={() => {
          setDuplicateSource(null);
          setDuplicateSlug('');
        }}
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            {t('duplicateFrom', { name: duplicateSource?.displayName ?? '' })}
          </p>
          <label className="flex flex-col gap-1 text-sm">
            {t('slug')}
            <ThemedTextInput
              value={duplicateSlug}
              onChange={(e) => {
                setDuplicateSlug(e.target.value.toLowerCase());
              }}
            />
          </label>
          <div className="flex gap-2">
            <Button disabled={saving} type="button" onClick={() => void handleDuplicate()}>
              {t('duplicate')}
            </Button>
            <Button
              disabled={saving}
              type="button"
              variant="outline"
              onClick={() => {
                setDuplicateSource(null);
                setDuplicateSlug('');
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </GymAdaptiveOverlay>
    </RequireAdmin>
  );
}
