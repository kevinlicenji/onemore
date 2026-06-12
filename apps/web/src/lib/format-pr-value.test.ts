import type { PersonalRecordSummary } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

import { formatPrValue } from './format-pr-value';

function makeRecord(overrides: Partial<PersonalRecordSummary> = {}): PersonalRecordSummary {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    exerciseLibraryId: '00000000-0000-4000-8000-000000000002',
    exerciseName: 'Bench Press',
    prType: 'weight_pr',
    reps: 5,
    value: 100,
    achievedAt: '2026-06-12T10:00:00.000Z',
    ...overrides,
  };
}

describe('formatPrValue', () => {
  it('formats weight PR', () => {
    expect(formatPrValue(makeRecord())).toBe('100 kg × 5');
  });

  it('formats e1RM and volume PRs', () => {
    expect(formatPrValue(makeRecord({ prType: 'e1rm_pr', reps: null, value: 120 }))).toBe(
      '120 kg e1RM',
    );
    expect(formatPrValue(makeRecord({ prType: 'volume_pr', reps: 10, value: 2400 }))).toBe(
      '2400 kg volume',
    );
  });
});
