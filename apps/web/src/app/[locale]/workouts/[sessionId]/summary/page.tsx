'use client';

import type { PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { GymWorkoutSummary } from '@/components/workout/gym-workout-summary';
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
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [records, setRecords] = useState<PersonalRecordSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        locale={locale}
        records={records}
        session={session}
        labels={{
          dashboard: t('viewHistory'),
          done: t('summaryDone'),
          duration: t('summaryDuration'),
          prTitle: t('summaryPrTitle'),
          prs: t('summaryPrCount'),
          sets: t('summarySets'),
          subtitle: t('freeWorkoutTitle'),
          title: t('summaryTitle'),
          volume: t('summaryVolume'),
        }}
        translatePrType={(type) => tProgress(`prType_${type}`)}
      />
    </RequireAuth>
  );
}
