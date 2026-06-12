'use client';

import type { HistorySessionSummary } from '@onemore/shared';
import { Badge, Button, Card, CardContent, Input } from '@onemore/ui';
import { History } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymEmptyState } from '@/components/gym-ui/gym-empty-state';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { GymSegmentedControl } from '@/components/gym-ui/gym-segmented-control';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { RequireAuth } from '@/components/require-auth';
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel';
import { useIsDesktop } from '@/hooks/use-is-desktop';
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
  const isDesktop = useIsDesktop();

  const [items, setItems] = useState<HistorySessionSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<HistoryDatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const cursorRef = useRef<string | null>(null);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const filterOptions = useMemo(
    () => PRESETS.map((value) => ({ value, label: t(`filter_${value}`) })),
    [t],
  );

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

  const refreshHistory = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setError(null);
    try {
      const dateRange = buildHistoryDateRange(preset, customFrom, customTo);
      const result = await fetchHistorySessions(accessToken, {
        limit: 20,
        ...dateRange,
      });
      setItems(result.items);
      setCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    }
  }, [accessToken, customFrom, customTo, preset, t]);

  const loadMore = useCallback((): void => {
    const nextCursor = cursorRef.current;
    if (!nextCursor || loading) {
      return;
    }
    void loadPage(nextCursor);
  }, [loadPage, loading]);

  const infiniteScrollRef = useInfiniteScrollSentinel({
    enabled: isDesktop === false,
    hasMore: cursor !== null,
    loading,
    onLoadMore: loadMore,
  });

  function sessionMeta(session: HistorySessionSummary): string {
    const date = session.completedAt
      ? formatDate(session.completedAt, locale)
      : formatDate(session.startedAt, locale);
    const duration =
      session.durationSeconds !== null
        ? ` · ${String(Math.round(session.durationSeconds / 60))} min`
        : '';
    return `${date} · ${t('sessionMeta', {
      sets: session.totalSets,
      volume: session.totalVolumeKg,
    })}${duration}`;
  }

  const sessionListMobile = (
    <GymListGroup>
      {items.map((session) => (
        <GymListRow
          key={session.id}
          href={`/${locale}/history/${session.id}`}
          meta={
            <Badge className="ml-1 shrink-0" variant="secondary">
              {session.sessionType === 'free' ? t('typeFree') : t('typeProgrammed')}
            </Badge>
          }
          showChevron
          subtitle={sessionMeta(session)}
          title={session.workoutDayLabel ?? t('freeWorkout')}
        />
      ))}
    </GymListGroup>
  );

  const sessionListDesktop = (
    <StaggerGroup className="grid gap-3 sm:grid-cols-2">
      {items.map((session) => (
        <StaggerItem key={session.id}>
          <Link href={`/${locale}/history/${session.id}`}>
            <Card className="transition-colors hover:bg-muted/30">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{session.workoutDayLabel ?? t('freeWorkout')}</p>
                  <Badge variant="secondary">
                    {session.sessionType === 'free' ? t('typeFree') : t('typeProgrammed')}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{sessionMeta(session)}</p>
              </CardContent>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={t('title')}
        description={t('filterSubtitle')}
        onRefresh={isDesktop ? undefined : refreshHistory}
      >
        {isDesktop ? (
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
        ) : (
          <GymSegmentedControl
            ariaLabel={t('filterSubtitle')}
            options={filterOptions}
            value={preset}
            onChange={setPreset}
          />
        )}

        {preset === 'custom' ? (
          <div className={isDesktop ? 'grid max-w-xl grid-cols-3 gap-3' : 'grid grid-cols-2 gap-2'}>
            <label className="flex flex-col gap-1 text-sm">
              {t('filterFrom')}
              <Input
                className={isDesktop ? undefined : 'min-h-11'}
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('filterTo')}
              <Input
                className={isDesktop ? undefined : 'min-h-11'}
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                }}
              />
            </label>
            <div className={isDesktop ? 'flex items-end' : 'col-span-2'}>
              <Button
                className={isDesktop ? 'w-full' : 'min-h-11 w-full'}
                type="button"
                variant="outline"
                onClick={() => {
                  void loadPage(undefined, true);
                }}
              >
                {t('filterApply')}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading && items.length === 0 ? (
          <CardGridSkeleton count={isDesktop ? 4 : 3} columns="2" />
        ) : items.length === 0 && !error ? (
          isDesktop ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <GymEmptyState
              icon={<History aria-hidden className="h-7 w-7" />}
              title={t('empty')}
            />
          )
        ) : isDesktop ? (
          sessionListDesktop
        ) : (
          <StaggerGroup compact>
            <StaggerItem>{sessionListMobile}</StaggerItem>
          </StaggerGroup>
        )}

        {cursor && isDesktop ? (
          <Button
            className="w-fit"
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => {
              void loadPage(cursor);
            }}
          >
            {loading ? t('loading') : t('loadMore')}
          </Button>
        ) : null}

        {cursor && !isDesktop ? (
          <div ref={infiniteScrollRef} aria-hidden className="h-1 w-full">
            {loading ? <p className="py-4 text-center text-sm text-muted-foreground">{t('loading')}</p> : null}
          </div>
        ) : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
