'use client';

import type { ProgramDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { DifficultyStepsIcon } from '@/components/difficulty-steps-icon';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { ProgramDayList } from '@/components/program-day-list';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { deleteProgram, fetchProgramDetail } from '@/lib/api-auth';

export default function ProgramDetailPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const programId = typeof params.id === 'string' ? params.id : '';
  const isDesktop = useIsDesktop();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!accessToken || !programId) {
      return;
    }
    void fetchProgramDetail(accessToken, programId)
      .then(setProgram)
      .catch(() => {
        setError(t('programLoadError'));
      });
  }, [accessToken, programId, t]);

  async function handleDelete(): Promise<void> {
    if (!accessToken) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProgram(accessToken, programId);
      router.push(`/${locale}/programs`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  function openDayEditor(dayIndex: number): void {
    router.push(`/${locale}/programs/${programId}/edit?day=${String(dayIndex)}`);
  }

  function openNewDayEditor(): void {
    router.push(`/${locale}/programs/${programId}/edit?day=new`);
  }

  const headerActions =
    program !== null ? (
      <>
        <Button asChild>
          <Link href={`/${locale}/workouts/start`}>{t('startWorkoutFromProgram')}</Link>
        </Button>
        <Button type="button" variant="outline" onClick={openNewDayEditor}>
          {t('addDay')}
        </Button>
        <Button
          variant="ghost"
          disabled={deleting}
          type="button"
          onClick={() => {
            setDeleteConfirmOpen(true);
          }}
        >
          {t('deleteProgram')}
        </Button>
      </>
    ) : null;

  const description =
    program !== null
      ? t('programDaysMeta', {
          days: program.days.length,
        })
      : undefined;

  const titleTrailing =
    program !== null ? <DifficultyStepsIcon level={program.difficultyLevel} /> : null;

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={program?.name ?? t('loadingProgram')}
        description={description}
        actions={isDesktop ? headerActions : undefined}
        titleTrailing={titleTrailing}
        variant="wide"
      >
        {program ? (
          <ProgramDayList
            days={program.days}
            locale={locale}
            className={isDesktop ? 'grid grid-cols-1 gap-4 xl:grid-cols-2' : undefined}
            onDayClick={openDayEditor}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{error ?? t('loadingProgram')}</p>
        )}

        {!isDesktop ? (
          <GymMobileActions>
            <Button asChild>
              <Link href={`/${locale}/workouts/start`}>{t('startWorkoutFromProgram')}</Link>
            </Button>
            <Button type="button" variant="outline" onClick={openNewDayEditor}>
              {t('addDay')}
            </Button>
            <Button
              variant="outline"
              disabled={deleting}
              type="button"
              onClick={() => {
                setDeleteConfirmOpen(true);
              }}
            >
              {t('deleteProgram')}
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/${locale}/programs`}>{t('backToPrograms')}</Link>
            </Button>
          </GymMobileActions>
        ) : null}
        <GymActionSheet
          cancelLabel={t('cancel')}
          confirmLabel={t('deleteProgram')}
          destructive
          loading={deleting}
          message={t('deleteConfirm')}
          open={deleteConfirmOpen}
          title={t('deleteProgram')}
          onCancel={() => {
            setDeleteConfirmOpen(false);
          }}
          onConfirm={() => {
            void handleDelete();
          }}
        />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
