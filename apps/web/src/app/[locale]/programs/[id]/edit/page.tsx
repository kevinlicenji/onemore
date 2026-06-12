'use client';

import type { CreateProgramInput } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { ProgramBuilder, type BuilderDay } from '@/components/program-builder';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchProgramDetail, updateProgram } from '@/lib/api-auth';

export default function EditProgramPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const programId = typeof params.id === 'string' ? params.id : '';
  const isDesktop = useIsDesktop();

  const [initialName, setInitialName] = useState('');
  const [initialDays, setInitialDays] = useState<BuilderDay[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !programId) {
      return;
    }
    void fetchProgramDetail(accessToken, programId)
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
      .catch(() => {
        setError(t('programLoadError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken, programId, locale, t]);

  async function handleSubmit(input: CreateProgramInput): Promise<void> {
    if (!accessToken) {
      return;
    }
    const updated = await updateProgram(accessToken, programId, input);
    router.push(`/${locale}/programs/${updated.id}`);
  }

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={t('editProgramTitle')}
        description={t('editProgramHint')}
        variant="wide"
        actions={
          isDesktop ? (
            <Button asChild variant="outline">
              <Link href={`/${locale}/programs/${programId}`}>{t('backToProgram')}</Link>
            </Button>
          ) : undefined
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loadingProgram')}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <ProgramBuilder
            accessToken={accessToken ?? ''}
            locale={locale}
            initialName={initialName}
            initialDays={initialDays}
            submitLabel={t('saveChanges')}
            onSubmit={handleSubmit}
          />
        )}

        {!isDesktop ? (
          <GymMobileActions>
            <Button asChild variant="outline">
              <Link href={`/${locale}/programs/${programId}`}>{t('backToProgram')}</Link>
            </Button>
          </GymMobileActions>
        ) : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
