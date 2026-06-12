'use client';

import type { ProgramSummary } from '@onemore/shared';
import { Badge, Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { ProgramActionsMenu } from '@/components/program-actions-menu';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { activateProgram, deleteProgram, fetchPrograms } from '@/lib/api-auth';

export default function ProgramsPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    void loadPrograms()
      .catch(() => {
        setError(t('programsLoadError'));
      })
      .finally(() => {
        setLoading(false);
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

  const headerActions = (
    <>
      <Button asChild size={isDesktop ? 'default' : 'sm'} variant="outline">
        <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
      </Button>
      <Button asChild size={isDesktop ? 'default' : 'sm'}>
        <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
      </Button>
    </>
  );

  const mobileProgramList = (
    <GymListGroup>
      {programs.map((program) => (
        <GymListRow
          key={program.id}
          active={program.isActive}
          href={`/${locale}/programs/${program.id}`}
          meta={t('programListMeta', {
            days: program.daysCount,
            status: program.latestVersionStatus ?? 'draft',
          })}
          showChevron
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              {program.name}
              {program.isActive ? <Badge variant="accent">{t('activeBadge')}</Badge> : null}
            </span>
          }
          trailing={
            <ProgramActionsMenu
              disabled={actionId !== null}
              editHref={`/${locale}/programs/${program.id}/edit`}
              labels={{
                menu: t('programActionsMenu'),
                edit: t('editProgram'),
                setActive: t('setActive'),
                delete: t('deleteProgram'),
              }}
              showSetActive={!program.isActive && program.latestVersionStatus === 'published'}
              onDelete={() => {
                void handleDelete(program.id);
              }}
              onSetActive={() => {
                void handleActivate(program.id);
              }}
            />
          }
        />
      ))}
    </GymListGroup>
  );

  const desktopProgramList = (
    <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {programs.map((program) => (
        <StaggerItem key={program.id}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/${locale}/programs/${program.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{program.name}</p>
                    {program.isActive ? (
                      <Badge variant="accent">{t('activeBadge')}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('programListMeta', {
                      days: program.daysCount,
                      status: program.latestVersionStatus ?? 'draft',
                    })}
                  </p>
                </Link>
                <ProgramActionsMenu
                  disabled={actionId !== null}
                  editHref={`/${locale}/programs/${program.id}/edit`}
                  labels={{
                    menu: t('programActionsMenu'),
                    edit: t('editProgram'),
                    setActive: t('setActive'),
                    delete: t('deleteProgram'),
                  }}
                  showSetActive={
                    !program.isActive && program.latestVersionStatus === 'published'
                  }
                  onDelete={() => {
                    void handleDelete(program.id);
                  }}
                  onSetActive={() => {
                    void handleActivate(program.id);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={t('myProgramsTitle')}
        description={`${t('myProgramsSubtitle')} ${t('singleActiveHint')}`}
        actions={headerActions}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 6 : 3} columns="3" />
        ) : programs.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">{t('noPrograms')}</p>
        ) : isDesktop ? (
          desktopProgramList
        ) : (
          <StaggerGroup compact>
            <StaggerItem>{mobileProgramList}</StaggerItem>
          </StaggerGroup>
        )}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
