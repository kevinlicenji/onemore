'use client';

import type { CreateProgramInput, TemplateMeta, TrainingGoal } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdminTemplateMetaForm } from '@/components/admin-template-meta-form';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import type { BuilderDay } from '@/components/program-builder-types';
import { ProgramBuilder } from '@/components/program-builder';
import { RequireAdmin } from '@/components/require-admin';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  fetchAdminTemplateDetail,
  publishAdminTemplate,
  updateAdminTemplate,
} from '@/lib/admin-api';

const defaultMeta: TemplateMeta = {
  displayName: { en: '', it: '' },
  audience: 'intermediate',
  daysPerWeek: 3,
  guide: { en: '', it: '' },
};

export default function AdminEditTemplatePage(): React.ReactElement {
  const t = useTranslations('Admin');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const isDesktop = useIsDesktop();

  const [meta, setMeta] = useState<TemplateMeta>(defaultMeta);
  const [objective, setObjective] = useState<TrainingGoal>('mass');
  const [initialName, setInitialName] = useState('');
  const [initialDays, setInitialDays] = useState<BuilderDay[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !slug) {
      return;
    }
    void fetchAdminTemplateDetail(accessToken, slug)
      .then((detail) => {
        setInitialName(detail.name);
        setObjective(detail.objective ?? 'mass');
        setMeta(detail.meta);
        setInitialDays(
          detail.days.map((day) => ({
            label: day.label,
            difficultyLevel: day.difficultyLevel,
            difficultyManual: true,
            exercises: day.exercises.map((row) => ({
              exerciseLibraryId: row.exerciseLibraryId,
              name:
                locale === 'it' && row.exercise.names.it
                  ? row.exercise.names.it
                  : row.exercise.names.en,
              primaryMuscles: row.exercise.primaryMuscles,
              targetSets: row.targetSets,
              targetReps: row.targetReps,
              restSeconds: row.restSeconds,
              targetWeightKg: row.targetWeightKg,
            })),
          })),
        );
      })
      .catch(() => {
        setError(t('loadError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken, locale, slug, t]);

  async function handleSaveDraft(input: CreateProgramInput): Promise<void> {
    if (!accessToken) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await updateAdminTemplate(accessToken, slug, {
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
      });
      setMessage(t('draftSaved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    }
  }

  async function handlePublish(): Promise<void> {
    if (!accessToken) {
      return;
    }
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      await publishAdminTemplate(accessToken, slug);
      setMessage(t('published'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('publishError'));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <RequireAdmin>
      <AdaptivePageShell
        actions={
          isDesktop ? (
            <div className="flex gap-2">
              <Button disabled={publishing} type="button" onClick={() => void handlePublish()}>
                {t('publish')}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/admin/templates`}>{t('backToTemplates')}</Link>
              </Button>
            </div>
          ) : undefined
        }
        description={t('editTemplateSubtitle', { slug })}
        title={t('editTemplateTitle')}
        variant="wide"
      >
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : (
          <>
            <div className="mb-6">
              <AdminTemplateMetaForm
                meta={meta}
                objective={objective}
                onMetaChange={setMeta}
                onObjectiveChange={setObjective}
              />
            </div>
            {accessToken && initialDays ? (
              <ProgramBuilder
                accessToken={accessToken}
                initialDays={initialDays}
                initialName={initialName}
                locale={locale}
                submitLabel={t('saveDraft')}
                onSubmit={handleSaveDraft}
              />
            ) : null}
          </>
        )}
        {!isDesktop ? (
          <GymMobileActions>
            <Button disabled={publishing} type="button" onClick={() => void handlePublish()}>
              {t('publish')}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/templates`}>{t('backToTemplates')}</Link>
            </Button>
          </GymMobileActions>
        ) : null}
      </AdaptivePageShell>
    </RequireAdmin>
  );
}
