'use client';

import type { SupplementLogItem } from '@onemore/shared';
import { Plus, Pill } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactElement } from 'react';

interface DashboardSupplementsTodayProps {
  logs: SupplementLogItem[];
  totalCount: number;
  locale: string;
  mobile?: boolean;
}

export function DashboardSupplementsToday({
  logs,
  totalCount,
  locale,
  mobile = false,
}: DashboardSupplementsTodayProps): ReactElement {
  const t = useTranslations('Supplements');

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Pill aria-hidden className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-muted-foreground">{t('todayLogsTitle')}</p>
        </div>
        <Link
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gym-separator bg-gym-surface text-primary transition-transform active:scale-95"
          href={`/${locale}/supplements`}
          aria-label={t('addTitle')}
        >
          <Plus aria-hidden className="h-4 w-4" />
        </Link>
      </div>

      {totalCount > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {logs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-gym-separator bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{log.supplementName}</p>
                <p className="text-xs text-muted-foreground">
                  {log.amount} {log.supplementUnit}
                  {log.notes ? ` · ${log.notes}` : ''}
                </p>
              </div>
            </div>
          ))}
          {totalCount > 4 ? (
            <Link
              className="text-center text-xs font-medium text-primary"
              href={`/${locale}/supplements`}
            >
              +{totalCount - 4} {t('more' in t ? 'more' : 'more')}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-gym-separator px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">{t('noTodayLogs')}</p>
        </div>
      )}

      <Link
        className="mt-3 block text-center text-xs font-medium text-primary"
        href={`/${locale}/supplements`}
      >
        {t('title')} →
      </Link>
    </>
  );

  if (mobile) {
    return (
      <div className="rounded-2xl border border-gym-separator bg-gym-surface p-4 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gym-separator bg-card p-5 shadow-sm">
      {content}
    </div>
  );
}
