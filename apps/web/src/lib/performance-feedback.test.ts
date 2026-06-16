import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { WorkoutSessionDetail } from '@onemore/shared';

import { getBaselinePerformanceE1rm } from './performance-feedback';

const mockSessions: WorkoutSessionDetail[] = [];

vi.mock('@/lib/offline/db', () => ({
  offlineDb: {
    sessions: {
      filter: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve(mockSessions)),
      })),
    },
  },
}));

function buildSession(
  id: string,
  exerciseLibraryId: string,
  sets: Array<{ weightKg: number; reps: number }>,
): WorkoutSessionDetail {
  return {
    id,
    status: 'completed',
    sessionType: 'programmed',
    programAssignmentId: null,
    workoutDayId: null,
    workoutDayLabel: 'Day A',
    workoutDayDifficultyLevel: null,
    startedAt: '2026-06-01T10:00:00.000Z',
    completedAt: '2026-06-01T11:00:00.000Z',
    durationSeconds: 3600,
    privateNotes: null,
    exercises: [
      {
        id: 'exec-1',
        exerciseLibraryId,
        sortOrder: 0,
        status: 'completed',
        athleteNotes: null,
        prescription: {
          targetSets: 3,
          targetReps: 8,
          targetWeightKg: 80,
          restSeconds: 90,
          coachNote: null,
          weightPrescriptionMode: 'absolute',
          targetPercentOfMax: undefined,
        },
        exercise: {
          id: exerciseLibraryId,
          slug: 'bench-press',
          names: { en: 'Bench Press' },
          isBodyweight: false,
        },
        previousSet: null,
        previousExecution: null,
        sets: sets.map((set, index) => ({
          id: `set-${id}-${String(index)}`,
          setNumber: index + 1,
          weightKg: set.weightKg,
          reps: set.reps,
          rpe: null,
          rir: null,
          isWarmup: false,
          isCompleted: true,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: '2026-06-01T10:30:00.000Z',
        })),
      },
    ],
  };
}

describe('getBaselinePerformanceE1rm', () => {
  beforeEach(() => {
    mockSessions.length = 0;
  });

  it('returns null when no prior history exists', async () => {
    const result = await getBaselinePerformanceE1rm('ex-1', 'current-session');
    expect(result).toBeNull();
  });

  it('averages per-session max e1RM from prior completed workouts', async () => {
    mockSessions.push(
      buildSession('past-1', 'ex-1', [{ weightKg: 100, reps: 5 }]),
      buildSession('past-2', 'ex-1', [{ weightKg: 90, reps: 6 }]),
    );

    const result = await getBaselinePerformanceE1rm('ex-1', 'current-session');
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThan(0);
  });
});
