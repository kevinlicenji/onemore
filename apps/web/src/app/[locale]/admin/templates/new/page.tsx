'use client';

import type {
  AdminCreateTemplate,
  CreateProgramInput,
  TemplateMeta,
  TrainingGoal,
} from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdminTemplateMetaForm } from '@/components/admin-template-meta-form';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { ProgramBuilder } from '@/components/program-builder';
import { RequireAdmin } from '@/components/require-admin';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { createAdminTemplate } from '@/lib/admin-api';

const defaultMeta: TemplateMeta = {
  displayName: { en: '', it: '' },
  audience: 'intermediate',
  daysPerWeek: 3,
  guide: { en: '', it: '' },
};

export default function AdminNewTemplatePage(): React.ReactElement {
  const t = useTranslations('Admin');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [slug, setSlug] = useState('');
  const [meta, setMeta] = useState<TemplateMeta>(defaultMeta);
  const [objective, setObjective] = useState<TrainingGoal>('mass');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: CreateProgramInput): Promise<void> {
    if (!accessToken) {
      return;
    }
    setError(null);
    const payload: AdminCreateTemplate = {
      slug: slug.trim().toLowerCase(),
      meta: {
        ...meta,
        displayName: {
          en: input.name.trim() || meta.displayName.en,
          it: meta.displayName.it,
        },
        daysPerWeek: input.days.length,
      },
      objective,
      days: input.days,
    };
    try {
      await createAdminTemplate(accessToken, payload);
      router.push(`/${locale}/admin/templates/${slug.trim().toLowerCase()}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    }
  }

  return (
    <RequireAdmin>
      <AdaptivePageShell
        actions={
          isDesktop ? (
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/templates`}>{t('backToTemplates')}</Link>
            </Button>
          ) : undefined
        }
        description={t('newTemplateSubtitle')}
        title={t('newTemplateTitle')}
        variant="wide"
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="mb-6 flex flex-col gap-4">
          <label className="flex max-w-md flex-col gap-1 text-sm">
            {t('slug')}
            <ThemedTextInput
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase());
              }}
            />
          </label>
          <AdminTemplateMetaForm
            meta={meta}
            objective={objective}
            onMetaChange={setMeta}
            onObjectiveChange={setObjective}
          />
        </div>
        {accessToken ? (
          <ProgramBuilder
            accessToken={accessToken}
            initialName={meta.displayName.en}
            locale={locale}
            submitLabel={t('saveDraft')}
            onSubmit={handleSubmit}
          />
        ) : null}
        {!isDesktop ? (
          <GymMobileActions>
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/templates`}>{t('backToTemplates')}</Link>
            </Button>
          </GymMobileActions>
        ) : null}
      </AdaptivePageShell>
    </RequireAdmin>
  );
}
