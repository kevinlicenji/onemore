'use client';

import type { PersonalRecordSummary } from '@onemore/shared';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { formatPrValue } from '@/lib/format-pr-value';

interface DashboardRecentPrsProps {
  records: PersonalRecordSummary[];
  locale: string;
  mobile?: boolean;
}

/**
 * Dashboard snippet of the athlete's most recent personal records.
 */
export function DashboardRecentPrs({
  records,
  locale,
  mobile = false,
}: DashboardRecentPrsProps): ReactElement | null {
  const t = useTranslations('Dashboard');

  if (records.length === 0) {
    return null;
  }

  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Trophy aria-hidden className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-muted-foreground">{t('recentPrsTitle')}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {records.slice(0, 3).map((record) => (
          <li
            key={record.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gym-separator bg-background/80 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{record.exerciseName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(record.achievedAt).toLocaleDateString(locale)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-primary">
              {formatPrValue(record)}
            </p>
          </li>
        ))}
      </ul>
      <Link
        className="mt-3 block text-center text-xs font-medium text-primary"
        href={`/${locale}/history`}
      >
        {t('recentPrsLink')} →
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
    <div className="rounded-lg border border-gym-separator bg-card p-5 shadow-sm">{content}</div>
  );
}
