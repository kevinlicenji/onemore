'use client';

import type { ProgramDetail } from '@onemore/shared';
import { Badge, Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
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
    if (!accessToken || !window.confirm(t('deleteConfirm'))) {
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
    }
  }

  const headerActions =
    program !== null ? (
      <>
        <Button asChild>
          <Link href={`/${locale}/workouts/start`}>{t('startWorkoutFromProgram')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/${locale}/programs/${programId}/edit`}>{t('editProgram')}</Link>
        </Button>
        <Button
          variant="ghost"
          disabled={deleting}
          type="button"
          onClick={() => {
            void handleDelete();
          }}
        >
          {t('deleteProgram')}
        </Button>
      </>
    ) : null;

  const description =
    program !== null
      ? t('programDetailMeta', {
          days: program.days.length,
          status: program.versionStatus ?? 'draft',
        })
      : undefined;

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={program?.name ?? t('loadingProgram')}
        description={description}
        actions={isDesktop ? headerActions : undefined}
        variant="wide"
      >
        {program?.isActive ? <Badge variant="accent">{t('activeBadge')}</Badge> : null}

        {program ? (
          <ProgramDayList
            days={program.days}
            locale={locale}
            className={isDesktop ? 'grid grid-cols-1 gap-4 xl:grid-cols-2' : undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{error ?? t('loadingProgram')}</p>
        )}

        {!isDesktop ? (
          <div className="flex flex-col gap-2">
            <Button asChild className="min-h-11">
              <Link href={`/${locale}/workouts/start`}>{t('startWorkoutFromProgram')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/programs/${programId}/edit`}>{t('editProgram')}</Link>
            </Button>
            <Button
              variant="ghost"
              disabled={deleting}
              type="button"
              onClick={() => {
                void handleDelete();
              }}
            >
              {t('deleteProgram')}
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/${locale}/programs`}>{t('backToPrograms')}</Link>
            </Button>
          </div>
        ) : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
