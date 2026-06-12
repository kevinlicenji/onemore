'use client';

import type { ProgramSummary } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { activateProgram, deleteProgram, fetchPrograms } from '@/lib/api-auth';

export default function ProgramsPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPrograms = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    const data = await fetchPrograms(accessToken);
    setPrograms(data);
  }, [accessToken]);

  useEffect(() => {
    void loadPrograms().catch(() => {
      setError(t('programsLoadError'));
    });
  }, [loadPrograms, t]);

  async function handleActivate(programId: string): Promise<void> {
    if (!accessToken) {
      return;
    }
    setActionId(programId);
    setError(null);
    try {
      await activateProgram(accessToken, programId);
      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('activateError'));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(programId: string): Promise<void> {
    if (!accessToken || !window.confirm(t('deleteConfirm'))) {
      return;
    }
    setActionId(programId);
    setError(null);
    try {
      await deleteProgram(accessToken, programId);
      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setActionId(null);
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('myProgramsTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('myProgramsSubtitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('singleActiveHint')}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {programs.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">{t('noPrograms')}</p>
        )}

        <div className="flex flex-col gap-3">
          {programs.map((program) => (
            <div key={program.id} className="rounded-lg border p-4">
              <Link href={`/${locale}/programs/${program.id}`} className="block">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{program.name}</p>
                  {program.isActive && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {t('activeBadge')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('programListMeta', {
                    days: program.daysCount,
                    status: program.latestVersionStatus ?? 'draft',
                  })}
                </p>
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${locale}/programs/${program.id}/edit`}>{t('editProgram')}</Link>
                </Button>
                {!program.isActive && program.latestVersionStatus === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionId !== null}
                    type="button"
                    onClick={() => {
                      void handleActivate(program.id);
                    }}
                  >
                    {t('setActive')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={actionId !== null}
                  type="button"
                  onClick={() => {
                    void handleDelete(program.id);
                  }}
                >
                  {t('deleteProgram')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
          </Button>
        </div>
      </main>
    </RequireAuth>
  );
}
