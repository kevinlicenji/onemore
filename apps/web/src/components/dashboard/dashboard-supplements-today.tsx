'use client';

import type { SupplementLogItem, SupplementUnit } from '@onemore/shared';
import { cn } from '@onemore/ui';
import { Pill, Plus } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

interface DashboardSupplementsTodayProps {
  logs: SupplementLogItem[];
  totalCount: number;
  locale: string;
  mobile?: boolean;
  loading?: boolean;
  error?: string | null;
}

function formatUnit(amount: number, unit: SupplementUnit): string {
  const rounded = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  switch (unit) {
    case 'capsule':
      return `${rounded} caps`;
    case 'scoop':
      return `${rounded} scoop`;
    case 'drops':
      return `${rounded} drops`;
    default:
      return `${rounded} ${unit}`;
  }
}

/**
 * Dashboard card for today's supplement intake — aligned with other dashboard widgets.
 */
export function DashboardSupplementsToday({
  logs,
  totalCount,
  locale,
  mobile = false,
  loading = false,
  error = null,
}: DashboardSupplementsTodayProps): ReactElement {
  const t = useTranslations('Supplements');

  const shellClass = mobile
    ? 'rounded-2xl border border-gym-separator bg-gym-surface p-4 shadow-sm'
    : 'rounded-lg border border-gym-separator bg-card p-5 shadow-sm';

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="flex flex-col gap-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Pill aria-hidden className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{t('dashboardCardTitle')}</p>
            {totalCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {totalCount} {t('dashboardLoggedToday')}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gym-separator bg-background text-primary transition-transform active:scale-95',
            mobile && 'shadow-sm',
          )}
          href={`/${locale}/supplements`}
          aria-label={t('addTitle')}
        >
          <Plus aria-hidden className="h-4 w-4" />
        </Link>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {totalCount > 0 ? (
        <ul className="mt-3 space-y-2">
          {logs.slice(0, 5).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gym-separator bg-background/80 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{log.supplementName}</p>
                {log.notes ? (
                  <p className="truncate text-xs text-muted-foreground">{log.notes}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatUnit(log.amount, log.supplementUnit)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-gym-separator px-3 py-4 text-center">
          <p className="text-sm font-medium text-foreground">{t('dashboardEmptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('dashboardEmptyBody')}</p>
          <Link
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground"
            href={`/${locale}/supplements`}
          >
            {t('dashboardLogCta')}
          </Link>
        </div>
      )}

      {totalCount > 5 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('dashboardMoreCount', { count: totalCount - 5 })}
        </p>
      ) : null}

      <Link
        className="mt-3 block text-center text-xs font-medium text-primary"
        href={`/${locale}/supplements`}
      >
        {t('dashboardOpenLibrary')} →
      </Link>
    </>
  );

  return <div className={shellClass}>{content}</div>;
}
