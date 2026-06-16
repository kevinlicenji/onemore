'use client';

import type { CreateProgramInput } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import type { BuilderDay } from '@/components/program-builder-types';
import { ProgramBuilder } from '@/components/program-builder';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchProgramDetail, updateProgram } from '@/lib/api-auth';

export default function EditProgramPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const programId = typeof params.id === 'string' ? params.id : '';
  const isDesktop = useIsDesktop();

  const dayParam = searchParams.get('day');
  const dayFocusMode = dayParam !== null;
  const startWithNewDay = dayParam === 'new';
  const initialDayIndex = useMemo(() => {
    if (startWithNewDay || dayParam === null) {
      return 0;
    }
    const parsed = Number(dayParam);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [dayParam, startWithNewDay]);

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
              weightPrescriptionMode: row.weightPrescriptionMode ?? 'absolute',
              targetPercentOfMax: row.targetPercentOfMax ?? null,
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

  const pageTitle = dayFocusMode ? t('editDayTitle') : t('editProgramTitle');
  const pageDescription = dayFocusMode ? t('editDayHint') : t('editProgramHint');

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={pageTitle}
        description={pageDescription}
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
            dayFocusMode={dayFocusMode}
            initialDayIndex={initialDayIndex}
            initialDays={initialDays}
            initialName={initialName}
            locale={locale}
            startWithNewDay={startWithNewDay}
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
