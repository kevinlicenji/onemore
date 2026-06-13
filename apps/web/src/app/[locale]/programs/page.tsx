'use client';

import type { ProgramSummary } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, type ReactElement } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { ProgramActionsMenu } from '@/components/program-actions-menu';
import { RequireAuth } from '@/components/require-auth';
import { DifficultyStepsIcon } from '@/components/difficulty-steps-icon';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { activateProgram, deleteProgram, fetchPrograms } from '@/lib/api-auth';

export default function ProgramsPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken, profile } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const activeProgram = programs.find((program) => program.isActive);
  const programsDifficulty = activeProgram?.difficultyLevel ?? programs[0]?.difficultyLevel ?? 2;
  const motivationalLine = useMotivationalLine('programs', profile, {
    difficultyLevel: programsDifficulty,
  });

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

  const showHeaderActions = isDesktop && programs.length > 0;

  const programActionButtons = (
    <>
      <Button asChild variant="outline">
        <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
      </Button>
      <Button asChild>
        <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
      </Button>
    </>
  );

  const headerActions = showHeaderActions ? programActionButtons : null;

  const emptyProgramsContent = (
    <div className="flex flex-col gap-4">
      <Card className="border-dashed bg-gym-tint/30">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <ClipboardList aria-hidden className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{t('emptyHeadline')}</p>
          <p className="text-sm text-muted-foreground">{t('emptyBody')}</p>
        </CardContent>
      </Card>

      <GymListGroup title={t('getStartedTitle')}>
        <GymListRow
          href={`/${locale}/programs/templates`}
          showChevron
          subtitle={t('browseTemplatesHint')}
          title={t('browseTemplates')}
        />
        <GymListRow
          href={`/${locale}/programs/new`}
          showChevron
          subtitle={t('buildManualHint')}
          title={t('buildManual')}
        />
      </GymListGroup>

      <GymListGroup title={t('howItWorksTitle')}>
        <GymListRow subtitle={t('howItWorksStep1Hint')} title={t('howItWorksStep1')} />
        <GymListRow subtitle={t('howItWorksStep2Hint')} title={t('howItWorksStep2')} />
        <GymListRow subtitle={t('howItWorksStep3Hint')} title={t('howItWorksStep3')} />
      </GymListGroup>
    </div>
  );

  const draftPrograms = programs.filter((program) => !program.isActive);

  function programActions(program: ProgramSummary): ReactElement {
    return (
      <div className="flex shrink-0 items-center gap-1.5 pr-1">
        <DifficultyStepsIcon level={program.difficultyLevel} size="sm" />
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
      </div>
    );
  }

  const mobileProgramList = (
    <div className="flex flex-col gap-5">
      {activeProgram ? (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('myScheduleSection')}
          </h2>
          <GymListGroup>
            <GymListRow
              active
              href={`/${locale}/programs/${activeProgram.id}`}
              subtitle={t('programDaysMeta', { days: activeProgram.daysCount })}
              title={activeProgram.name}
              trailing={programActions(activeProgram)}
            />
          </GymListGroup>
        </section>
      ) : null}

      {draftPrograms.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('draftsSection')}
          </h2>
          <GymListGroup>
            {draftPrograms.map((program) => (
              <GymListRow
                key={program.id}
                href={`/${locale}/programs/${program.id}`}
                subtitle={t('programDaysMeta', { days: program.daysCount })}
                title={program.name}
                trailing={programActions(program)}
              />
            ))}
          </GymListGroup>
        </section>
      ) : null}

      <section className="flex flex-col items-center gap-3 px-8 pt-1">
        <div className="h-px w-24 bg-gym-separator" />
        <Button asChild className="min-h-12 w-full" variant="outline">
          <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
        </Button>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          {t('browseSectionPrompt')}
        </p>
        <Button asChild className="min-h-10 w-full max-w-xs text-sm" size="sm">
          <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
        </Button>
      </section>
    </div>
  );

  const desktopProgramList = (
    <div className="flex flex-col gap-8">
      {activeProgram ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('myScheduleSection')}
          </h2>
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StaggerItem key={activeProgram.id}>
              <Card className="h-full border-primary/25 transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/${locale}/programs/${activeProgram.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="font-semibold">{activeProgram.name}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('programDaysMeta', { days: activeProgram.daysCount })}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-start gap-2">
                      <DifficultyStepsIcon level={activeProgram.difficultyLevel} />
                      {programActions(activeProgram)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerGroup>
        </section>
      ) : null}

      {draftPrograms.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('draftsSection')}
          </h2>
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {draftPrograms.map((program) => (
              <StaggerItem key={program.id}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/${locale}/programs/${program.id}`} className="min-w-0 flex-1">
                        <p className="font-semibold">{program.name}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t('programDaysMeta', { days: program.daysCount })}
                        </p>
                      </Link>
                      <div className="flex shrink-0 items-start gap-2">
                        <DifficultyStepsIcon level={program.difficultyLevel} />
                        {programActions(program)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      ) : null}

      <section className="flex flex-col items-center gap-3 border-t border-gym-separator/80 px-8 py-8">
        <Button asChild variant="outline">
          <Link href={`/${locale}/programs/templates`}>{t('browseTemplates')}</Link>
        </Button>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {t('browseSectionPrompt')}
        </p>
        <Button asChild size="sm">
          <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
        </Button>
      </section>
    </div>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={t('myProgramsTitle')}
        description={motivationalLine}
        actions={headerActions}
        onRefresh={isDesktop ? undefined : loadPrograms}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <CardGridSkeleton count={isDesktop ? 6 : 3} columns="3" />
        ) : programs.length === 0 && !error ? (
          isDesktop ? (
            emptyProgramsContent
          ) : (
            emptyProgramsContent
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
