import { describe, expect, it } from 'vitest';

import { historySummaryToDashboardInput } from './dashboard-store';

describe('historySummaryToDashboardInput', () => {
  it('returns null for sessions without completedAt', () => {
    expect(
      historySummaryToDashboardInput({
        id: 's1',
        status: 'completed',
        sessionType: 'free',
        workoutDayLabel: null,
        startedAt: '2026-06-01T10:00:00.000Z',
        completedAt: null,
        durationSeconds: null,
        exerciseCount: 1,
        totalSets: 5,
        totalVolumeKg: 500,
      }),
    ).toBeNull();
  });

  it('maps completed summaries for KPI computation', () => {
    expect(
      historySummaryToDashboardInput({
        id: 's1',
        status: 'completed',
        sessionType: 'free',
        workoutDayLabel: null,
        startedAt: '2026-06-01T10:00:00.000Z',
        completedAt: '2026-06-01T11:00:00.000Z',
        durationSeconds: 3600,
        exerciseCount: 1,
        totalSets: 5,
        totalVolumeKg: 500,
      }),
    ).toEqual({
      id: 's1',
      completedAt: '2026-06-01T11:00:00.000Z',
      sessionType: 'free',
      workoutDayId: null,
      workoutDayLabel: null,
      totalSets: 5,
      totalVolumeKg: 500,
    });
  });
});
