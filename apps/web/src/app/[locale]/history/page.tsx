'use client';

import type { HistorySessionSummary } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { fetchHistorySessions } from '@/lib/api-auth';

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoryPage(): React.ReactElement {
  const t = useTranslations('History');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [items, setItems] = useState<HistorySessionSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (nextCursor?: string): Promise<void> => {
      if (!accessToken) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchHistorySessions(accessToken, {
          limit: 20,
          ...(nextCursor ? { cursor: nextCursor } : {}),
        });
        setItems((prev) => (nextCursor ? [...prev, ...result.items] : result.items));
        setCursor(result.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('loadError'));
      } finally {
        setLoading(false);
      }
    },
    [accessToken, t],
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {items.length === 0 && !loading && !error && (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        )}

        <ul className="flex flex-col gap-2">
          {items.map((session) => (
            <li key={session.id}>
              <Link
                className="block rounded-lg border p-4 transition hover:bg-muted/50"
                href={`/${locale}/history/${session.id}`}
              >
                <p className="font-medium">{session.workoutDayLabel ?? t('freeWorkout')}</p>
                <p className="text-sm text-muted-foreground">
                  {session.completedAt
                    ? formatDate(session.completedAt, locale)
                    : formatDate(session.startedAt, locale)}
                  {' · '}
                  {t('sessionMeta', {
                    sets: session.totalSets,
                    volume: session.totalVolumeKg,
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {cursor && (
          <Button
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => {
              void loadPage(cursor);
            }}
          >
            {loading ? t('loading') : t('loadMore')}
          </Button>
        )}
      </main>
    </RequireAuth>
  );
}
