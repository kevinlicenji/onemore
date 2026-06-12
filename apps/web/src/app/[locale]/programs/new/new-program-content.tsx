'use client';

import type { CreateProgramInput } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ProgramBuilder, type BuilderDay } from '@/components/program-builder';
import { RequireAuth } from '@/components/require-auth';
import { createProgram, fetchProgramTemplateDetail, publishProgram } from '@/lib/api-auth';
import { trackEvent } from '@/lib/analytics';

export function NewProgramPageContent(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const templateSlug = searchParams.get('template');

  const [initialName, setInitialName] = useState('');
  const [initialDays, setInitialDays] = useState<BuilderDay[] | undefined>(undefined);
  const [loadingTemplate, setLoadingTemplate] = useState(Boolean(templateSlug));

  useEffect(() => {
    if (!accessToken || !templateSlug) {
      setLoadingTemplate(false);
      return;
    }

    void fetchProgramTemplateDetail(accessToken, templateSlug)
      .then((detail) => {
        setInitialName(detail.name);
        setInitialDays(
          detail.days.map((day) => ({
            label: day.label,
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
      .finally(() => {
        setLoadingTemplate(false);
      });
  }, [accessToken, templateSlug, locale]);

  async function handleSubmit(input: CreateProgramInput): Promise<void> {
    if (!accessToken) {
      return;
    }
    const created = await createProgram(accessToken, input);
    const published = await publishProgram(accessToken, created.id);
    trackEvent('program_created', {
      program_id: published.id,
      source: templateSlug ? 'template_customized' : 'manual',
    });
    router.push(`/${locale}/programs/${published.id}`);
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">
          {templateSlug ? t('customizeTemplateTitle') : t('builderTitle')}
        </h1>
        {templateSlug && (
          <p className="text-sm text-muted-foreground">{t('customizeTemplateHint')}</p>
        )}

        {loadingTemplate ? (
          <p className="text-sm text-muted-foreground">{t('loadingProgram')}</p>
        ) : (
          <ProgramBuilder
            accessToken={accessToken ?? ''}
            locale={locale}
            initialName={initialName}
            initialDays={initialDays}
            submitLabel={t('saveAndPublish')}
            onSubmit={handleSubmit}
          />
        )}

        <Button asChild variant="ghost">
          <Link href={`/${locale}/programs/templates`}>{t('useTemplate')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
