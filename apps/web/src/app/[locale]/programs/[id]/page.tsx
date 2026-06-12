'use client';

import type { ProgramDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ProgramDayList } from '@/components/program-day-list';
import { RequireAuth } from '@/components/require-auth';
import { deleteProgram, fetchProgramDetail } from '@/lib/api-auth';

export default function ProgramDetailPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const programId = typeof params.id === 'string' ? params.id : '';
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

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
        {program ? (
          <>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{program.name}</h1>
                {program.isActive && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {t('activeBadge')}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('programDetailMeta', {
                  days: program.days.length,
                  status: program.versionStatus ?? 'draft',
                })}
              </p>
            </div>
            <ProgramDayList days={program.days} locale={locale} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{error ?? t('loadingProgram')}</p>
        )}

        <div className="flex flex-col gap-2">
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
          <Button asChild variant="ghost">
            <Link href={`/${locale}/programs`}>{t('backToPrograms')}</Link>
          </Button>
        </div>
      </main>
    </RequireAuth>
  );
}
