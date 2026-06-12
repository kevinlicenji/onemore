'use client';

import type { ProgramSummary } from '@onemore/shared';
import { Badge, Button, Card, CardContent } from '@onemore/ui';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  function requestDelete(programId: string): void {
    setPendingDeleteId(programId);
  }

  async function confirmDelete(): Promise<void> {
    if (!accessToken || pendingDeleteId === null) {
      return;
    }
    const programId = pendingDeleteId;
    setActionId(programId);
    setError(null);
    try {
      await deleteProgram(accessToken, programId);
      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setActionId(null);
      setPendingDeleteId(null);
    }
  }

  const headerActions = isDesktop ? (
    <>
      <Button asChild variant="outline">
        <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
      </Button>
      <Button asChild>
        <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
      </Button>
    </>
  ) : (
    <>
      <Button asChild className="min-h-11">
        <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
      </Button>
      <Button asChild className="min-h-11" variant="outline">
        <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
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
          showChevron
          subtitle={t('programListMeta', {
            days: program.daysCount,
            status: program.latestVersionStatus ?? 'draft',
          })}
          title={
            <span className="inline-flex items-center gap-2">
              <span className="truncate">{program.name}</span>
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
                requestDelete(program.id);
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
                    requestDelete(program.id);
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
        onRefresh={isDesktop ? undefined : loadPrograms}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 6 : 3} columns="3" />
        ) : programs.length === 0 && !error ? (
          isDesktop ? (
            <p className="text-sm text-muted-foreground">{t('noPrograms')}</p>
          ) : (
            <GymEmptyState
              action={
                <div className="flex flex-col gap-2">
                  <Button asChild className="min-h-11 w-full">
                    <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
                  </Button>
                  <Button asChild className="min-h-11 w-full" variant="outline">
                    <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
                  </Button>
                </div>
              }
              icon={<ClipboardList aria-hidden className="h-7 w-7" />}
              title={t('noPrograms')}
            />
          )
        ) : isDesktop ? (
          desktopProgramList
        ) : (
          <StaggerGroup compact>
            <StaggerItem>{mobileProgramList}</StaggerItem>
          </StaggerGroup>
        )}
        <GymActionSheet
          cancelLabel={t('cancel')}
          confirmLabel={t('deleteProgram')}
          destructive
          loading={pendingDeleteId !== null && actionId === pendingDeleteId}
          message={t('deleteConfirm')}
          open={pendingDeleteId !== null}
          title={t('deleteProgram')}
          onCancel={() => {
            setPendingDeleteId(null);
          }}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
