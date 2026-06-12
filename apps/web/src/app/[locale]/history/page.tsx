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
import { buildHistoryDateRange, type HistoryDatePreset } from '@/lib/history-filters';

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const PRESETS: HistoryDatePreset[] = ['all', '7d', '30d', '90d', 'custom'];

export default function HistoryPage(): React.ReactElement {
  const t = useTranslations('History');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [items, setItems] = useState<HistorySessionSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<HistoryDatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const loadPage = useCallback(
    async (nextCursor?: string, replace = false): Promise<void> => {
      if (!accessToken) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const dateRange = buildHistoryDateRange(preset, customFrom, customTo);
        const result = await fetchHistorySessions(accessToken, {
          limit: 20,
          ...dateRange,
          ...(nextCursor ? { cursor: nextCursor } : {}),
        });
        setItems((prev) => (replace ? result.items : [...prev, ...result.items]));
        setCursor(result.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('loadError'));
      } finally {
        setLoading(false);
      }
    },
    [accessToken, customFrom, customTo, preset, t],
  );

  useEffect(() => {
    void loadPage(undefined, true);
  }, [loadPage]);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('filterSubtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((value) => (
            <Button
              key={value}
              size="sm"
              type="button"
              variant={preset === value ? 'default' : 'outline'}
              onClick={() => {
                setPreset(value);
              }}
            >
              {t(`filter_${value}`)}
            </Button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs">
              {t('filterFrom')}
              <input
                className="min-h-11 rounded-md border px-3 text-sm"
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {t('filterTo')}
              <input
                className="min-h-11 rounded-md border px-3 text-sm"
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                }}
              />
            </label>
            <Button
              className="col-span-2 min-h-11"
              type="button"
              variant="outline"
              onClick={() => {
                void loadPage(undefined, true);
              }}
            >
              {t('filterApply')}
            </Button>
          </div>
        )}

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
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{session.workoutDayLabel ?? t('freeWorkout')}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {session.sessionType === 'free' ? t('typeFree') : t('typeProgrammed')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.completedAt
                    ? formatDate(session.completedAt, locale)
                    : formatDate(session.startedAt, locale)}
                  {' · '}
                  {t('sessionMeta', {
                    sets: session.totalSets,
                    volume: session.totalVolumeKg,
                  })}
                  {session.durationSeconds !== null &&
                    ` · ${String(Math.round(session.durationSeconds / 60))} min`}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {cursor && (
          <Button
            className="min-h-11"
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
