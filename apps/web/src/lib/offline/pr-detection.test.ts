import type {
  PersonalRecordSummary,
  UpsertSetLogInput,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { detectOfflinePersonalRecords } from './pr-detection';

const mockRecords: PersonalRecordSummary[] = [];

vi.mock('@/lib/offline/db', () => ({
  offlineDb: {
    personalRecords: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve(mockRecords)),
        })),
      })),
    },
  },
}));

const exerciseLibraryId = '11111111-1111-4111-8111-111111111111';
const exerciseExecutionId = 'exec-1';

function buildSession(sets: WorkoutSessionDetail['exercises'][0]['sets']): WorkoutSessionDetail {
  return {
    id: 'session-1',
    status: 'in_progress',
    sessionType: 'free',
    programAssignmentId: null,
    workoutDayId: null,
    workoutDayLabel: null,
    workoutDayDifficultyLevel: null,
    startedAt: '2026-06-15T10:00:00.000Z',
    completedAt: null,
    durationSeconds: null,
    privateNotes: null,
    exercises: [
      {
        id: exerciseExecutionId,
        exerciseLibraryId,
        sortOrder: 0,
        status: 'in_progress',
        athleteNotes: null,
        prescription: {
          targetSets: 3,
          targetReps: 5,
          targetWeightKg: 100,
          restSeconds: 120,
          coachNote: null,
          weightPrescriptionMode: 'absolute',
          targetPercentOfMax: undefined,
        },
        exercise: {
          id: exerciseLibraryId,
          slug: 'squat',
          names: { en: 'Squat' },
          isBodyweight: false,
        },
        previousSet: null,
        previousExecution: null,
        sets,
      },
    ],
  };
}

function buildPayload(overrides: Partial<UpsertSetLogInput> = {}): UpsertSetLogInput {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    exerciseExecutionId,
    setNumber: 1,
    weightKg: 100,
    reps: 5,
    rpe: null,
    rir: 2,
    isWarmup: false,
    isCompleted: true,
    isSkipped: false,
    isFailed: false,
    clientTimestamp: '2026-06-15T10:30:00.000Z',
    ...overrides,
  };
}

describe('detectOfflinePersonalRecords', () => {
  beforeEach(() => {
    mockRecords.length = 0;
  });

  it('returns empty for incomplete working sets', async () => {
    const session = buildSession([]);
    const result = await detectOfflinePersonalRecords(
      session,
      buildPayload({ isCompleted: false }),
    );
    expect(result).toEqual([]);
  });

  it('returns empty for warmup sets', async () => {
    const session = buildSession([]);
    const result = await detectOfflinePersonalRecords(session, buildPayload({ isWarmup: true }));
    expect(result).toEqual([]);
  });

  it('detects a weight PR when no prior record exists at that rep count', async () => {
    const session = buildSession([
      {
        id: 'set-1',
        setNumber: 1,
        weightKg: 100,
        reps: 5,
        rpe: null,
        rir: 2,
        isWarmup: false,
        isCompleted: true,
        isSkipped: false,
        isFailed: false,
        clientTimestamp: '2026-06-15T10:30:00.000Z',
      },
    ]);

    const result = await detectOfflinePersonalRecords(session, buildPayload());

    expect(result.some((record) => record.prType === 'weight_pr' && record.value === 100)).toBe(
      true,
    );
  });

  it('skips weight PR when existing record is heavier at same reps', async () => {
    mockRecords.push({
      id: 'pr-weight',
      exerciseLibraryId,
      exerciseName: 'Squat',
      prType: 'weight_pr',
      reps: 5,
      value: 120,
      achievedAt: '2026-06-01T10:00:00.000Z',
    });

    const session = buildSession([
      {
        id: 'set-1',
        setNumber: 1,
        weightKg: 100,
        reps: 5,
        rpe: null,
        rir: 2,
        isWarmup: false,
        isCompleted: true,
        isSkipped: false,
        isFailed: false,
        clientTimestamp: '2026-06-15T10:30:00.000Z',
      },
    ]);

    const result = await detectOfflinePersonalRecords(session, buildPayload());
    expect(result.some((record) => record.prType === 'weight_pr')).toBe(false);
  });

  it('detects volume and e1rm PRs for a strong working set', async () => {
    const session = buildSession([
      {
        id: 'set-1',
        setNumber: 1,
        weightKg: 140,
        reps: 3,
        rpe: null,
        rir: 1,
        isWarmup: false,
        isCompleted: true,
        isSkipped: false,
        isFailed: false,
        clientTimestamp: '2026-06-15T10:30:00.000Z',
      },
    ]);

    const result = await detectOfflinePersonalRecords(
      session,
      buildPayload({ weightKg: 140, reps: 3 }),
    );

    expect(result.some((record) => record.prType === 'volume_pr')).toBe(true);
    expect(result.some((record) => record.prType === 'e1rm_pr')).toBe(true);
  });
});
