import type { PersonalRecordSummary } from '@onemore/shared';

/**
 * Formats a personal record value for display in celebration UIs.
 */
export function formatPrValue(record: PersonalRecordSummary): string {
  if (record.prType === 'e1rm_pr') {
    return `${String(record.value)} kg e1RM`;
  }
  if (record.prType === 'volume_pr') {
    return `${String(record.value)} kg volume`;
  }
  return `${String(record.value)} kg × ${record.reps !== null ? String(record.reps) : '?'}`;
}
