'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { RequireAuth } from '@/components/require-auth';
import { GymWorkoutSummary } from '@/components/workout/gym-workout-summary';
import { deleteHistorySession } from '@/lib/api-auth';
import { getWorkoutSessionClient } from '@/lib/offline/workout-client';

function readStoredPrs(sessionId: string): PersonalRecordSummary[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(`workout-summary-prs-${sessionId}`);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as PersonalRecordSummary[];
  } catch {
    return [];
  }
}

export default function WorkoutSummaryPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const tProgress = useTranslations('Progress');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [records, setRecords] = useState<PersonalRecordSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken || !sessionId) {
      return;
    }
    setRecords(readStoredPrs(sessionId));
    void getWorkoutSessionClient(accessToken, sessionId)
      .then((data) => {
        if (data.status !== 'completed') {
          setError(t('summaryNotReady'));
          return;
        }
        setSession(data);
      })
      .catch(() => {
        setError(t('loadError'));
      });
  }, [accessToken, sessionId, t]);

  async function handleDelete(): Promise<void> {
    if (!accessToken || !sessionId) {
      return;
    }
    setDeleting(true);
    try {
      await deleteHistorySession(accessToken, sessionId);
      router.replace(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteSessionError'));
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <RequireAuth>
        <p className="p-4 text-sm text-destructive">{error}</p>
      </RequireAuth>
    );
  }

  if (!session) {
    return (
      <RequireAuth>
        <p className="p-4 text-sm text-muted-foreground">{t('loading')}</p>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <GymWorkoutSummary
        editHref={`/${locale}/history/${sessionId}?edit=1`}
        locale={locale}
        records={records}
        session={session}
        labels={{
          dashboard: t('viewHistory'),
          deleteSession: t('deleteSession'),
          done: t('summaryDone'),
          duration: t('summaryDuration'),
          editSession: t('editSession'),
          prTitle: t('summaryPrTitle'),
          prs: t('summaryPrCount'),
          sets: t('summarySets'),
          subtitle: t('freeWorkoutTitle'),
          title: t('summaryTitle'),
          volume: t('summaryVolume'),
        }}
        translatePrType={(type) => tProgress(`prType_${type}`)}
        onDelete={() => {
          setDeleteOpen(true);
        }}
      />
      <GymActionSheet
        cancelLabel={t('cancel')}
        confirmLabel={t('deleteSession')}
        destructive
        loading={deleting}
        message={t('deleteSessionConfirm')}
        open={deleteOpen}
        title={t('deleteSession')}
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </RequireAuth>
  );
}
