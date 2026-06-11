'use client';

import type { PersonalRecordSummary } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';

interface PrCelebrationProps {
  records: PersonalRecordSummary[];
  onDismiss: () => void;
}

function formatPrValue(record: PersonalRecordSummary): string {
  if (record.prType === 'e1rm_pr') {
    return `${String(record.value)} kg e1RM`;
  }
  if (record.prType === 'volume_pr') {
    return `${String(record.value)} kg volume`;
  }
  return `${String(record.value)} kg × ${record.reps !== null ? String(record.reps) : '?'}`;
}

/**
 * In-app celebration modal when the athlete achieves a personal record.
 */
export function PrCelebration({
  records,
  onDismiss,
}: PrCelebrationProps): React.ReactElement | null {
  const t = useTranslations('Progress');

  if (records.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-labelledby="pr-celebration-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
        <h2 id="pr-celebration-title" className="text-xl font-bold">
          {t('prTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('prSubtitle')}</p>
        <ul className="mt-4 space-y-2">
          {records.map((record) => (
            <li key={record.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{record.exerciseName}</p>
              <p className="text-muted-foreground">
                {t(`prType_${record.prType}`)} · {formatPrValue(record)}
              </p>
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full" type="button" onClick={onDismiss}>
          {t('prDismiss')}
        </Button>
      </div>
    </div>
  );
}
