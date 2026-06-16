import type { WorkoutSessionDetail } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

import { findPreviousSetInSessions } from './resolve-previous-set';

function makeSession(
  overrides: Partial<WorkoutSessionDetail> & Pick<WorkoutSessionDetail, 'id' | 'status'>,
): WorkoutSessionDetail {
  return {
    sessionType: 'programmed',
    programAssignmentId: null,
    workoutDayId: null,
    workoutDayLabel: null,
    workoutDayDifficultyLevel: null,
    startedAt: '2026-06-01T10:00:00.000Z',
    completedAt: null,
    durationSeconds: null,
    privateNotes: null,
    exercises: [],
    ...overrides,
  };
}

describe('findPreviousSetInSessions', () => {
  const exerciseId = '11111111-1111-4111-8111-111111111111';

  it('returns the most recent completed working set', () => {
    const sessions: WorkoutSessionDetail[] = [
      makeSession({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        status: 'completed',
        exercises: [
          {
            id: 'exec-1',
            exerciseLibraryId: exerciseId,
            sortOrder: 0,
            status: 'completed',
            athleteNotes: null,
            prescription: {
              targetSets: 1,
              targetReps: 8,
              targetWeightKg: null,
              restSeconds: 90,
              coachNote: null,
            },
            exercise: {
              id: exerciseId,
              slug: 'bench',
              names: { en: 'Bench' },
              isBodyweight: false,
            },
            previousSet: null,
            sets: [
              {
                id: 'set-old',
                setNumber: 1,
                weightKg: 50,
                reps: 10,
                rpe: null,
                rir: null,
                isWarmup: false,
                isCompleted: true,
                isSkipped: false,
                isFailed: false,
                clientTimestamp: '2026-06-01T10:00:00.000Z',
              },
            ],
          },
        ],
      }),
      makeSession({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        status: 'completed',
        exercises: [
          {
            id: 'exec-2',
            exerciseLibraryId: exerciseId,
            sortOrder: 0,
            status: 'completed',
            athleteNotes: null,
            prescription: {
              targetSets: 1,
              targetReps: 8,
              targetWeightKg: null,
              restSeconds: 90,
              coachNote: null,
            },
            exercise: {
              id: exerciseId,
              slug: 'bench',
              names: { en: 'Bench' },
              isBodyweight: false,
            },
            previousSet: null,
            sets: [
              {
                id: 'set-new',
                setNumber: 1,
                weightKg: 60,
                reps: 8,
                rpe: null,
                rir: null,
                isWarmup: false,
                isCompleted: true,
                isSkipped: false,
                isFailed: false,
                clientTimestamp: '2026-06-02T10:00:00.000Z',
              },
            ],
          },
        ],
      }),
    ];

    expect(findPreviousSetInSessions(sessions, exerciseId)).toEqual({
      weightKg: 60,
      reps: 8,
    });
  });

  it('ignores warmup and incomplete sets', () => {
    const sessions: WorkoutSessionDetail[] = [
      makeSession({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        status: 'completed',
        exercises: [
          {
            id: 'exec-3',
            exerciseLibraryId: exerciseId,
            sortOrder: 0,
            status: 'completed',
            athleteNotes: null,
            prescription: {
              targetSets: 2,
              targetReps: 8,
              targetWeightKg: null,
              restSeconds: 90,
              coachNote: null,
            },
            exercise: {
              id: exerciseId,
              slug: 'bench',
              names: { en: 'Bench' },
              isBodyweight: false,
            },
            previousSet: null,
            sets: [
              {
                id: 'set-warmup',
                setNumber: 1,
                weightKg: 20,
                reps: 12,
                rpe: null,
                rir: null,
                isWarmup: true,
                isCompleted: true,
                isSkipped: false,
                isFailed: false,
                clientTimestamp: '2026-06-03T10:00:00.000Z',
              },
              {
                id: 'set-open',
                setNumber: 2,
                weightKg: 70,
                reps: 6,
                rpe: null,
                rir: null,
                isWarmup: false,
                isCompleted: false,
                isSkipped: false,
                isFailed: false,
                clientTimestamp: '2026-06-03T10:05:00.000Z',
              },
            ],
          },
        ],
      }),
    ];

    expect(findPreviousSetInSessions(sessions, exerciseId)).toBeNull();
  });

  it('excludes the provided session id', () => {
    const sessionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const sessions: WorkoutSessionDetail[] = [
      makeSession({
        id: sessionId,
        status: 'completed',
        exercises: [
          {
            id: 'exec-4',
            exerciseLibraryId: exerciseId,
            sortOrder: 0,
            status: 'completed',
            athleteNotes: null,
            prescription: {
              targetSets: 1,
              targetReps: 8,
              targetWeightKg: null,
              restSeconds: 90,
              coachNote: null,
            },
            exercise: {
              id: exerciseId,
              slug: 'bench',
              names: { en: 'Bench' },
              isBodyweight: false,
            },
            previousSet: null,
            sets: [
              {
                id: 'set-only',
                setNumber: 1,
                weightKg: 80,
                reps: 5,
                rpe: null,
                rir: null,
                isWarmup: false,
                isCompleted: true,
                isSkipped: false,
                isFailed: false,
                clientTimestamp: '2026-06-04T10:00:00.000Z',
              },
            ],
          },
        ],
      }),
    ];

    expect(
      findPreviousSetInSessions(sessions, exerciseId, { excludeSessionId: sessionId }),
    ).toBeNull();
  });

  it('returns null when no completed sessions match', () => {
    const sessions: WorkoutSessionDetail[] = [
      makeSession({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        status: 'in_progress',
        exercises: [],
      }),
    ];

    expect(findPreviousSetInSessions(sessions, exerciseId)).toBeNull();
  });
});
