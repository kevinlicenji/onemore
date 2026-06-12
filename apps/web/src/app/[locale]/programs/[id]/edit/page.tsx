'use client';

import type { CreateProgramInput } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ProgramBuilder, type BuilderDay } from '@/components/program-builder';
import { RequireAuth } from '@/components/require-auth';
import { fetchProgramDetail, updateProgram } from '@/lib/api-auth';

export default function EditProgramPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const programId = typeof params.id === 'string' ? params.id : '';

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
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">{t('editProgramTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('editProgramHint')}</p>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loadingProgram')}</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
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

        <Button asChild variant="ghost">
          <Link href={`/${locale}/programs/${programId}`}>{t('backToProgram')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
