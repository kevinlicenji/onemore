import type { WorkoutSessionDetail } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

import { computeWorkoutSessionStats } from './workout-stats';

const baseSession: WorkoutSessionDetail = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  status: 'completed',
  sessionType: 'programmed',
  programAssignmentId: null,
  workoutDayId: null,
  workoutDayLabel: 'Day A',
  startedAt: '2026-06-01T10:00:00.000Z',
  completedAt: '2026-06-01T11:00:00.000Z',
  durationSeconds: 3600,
  privateNotes: null,
  exercises: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      exerciseLibraryId: '550e8400-e29b-41d4-a716-446655440002',
      sortOrder: 0,
      status: 'completed',
      prescription: {
        targetSets: 2,
        targetReps: 8,
        targetWeightKg: 60,
        restSeconds: 90,
        coachNote: null,
      },
      exercise: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        slug: 'squat',
        names: { en: 'Squat' },
      },
      previousSet: null,
      sets: [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          setNumber: 1,
          weightKg: 60,
          reps: 8,
          isWarmup: false,
          isCompleted: true,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: '2026-06-01T10:05:00.000Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          setNumber: 2,
          weightKg: 60,
          reps: 8,
          isWarmup: false,
          isCompleted: true,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: '2026-06-01T10:08:00.000Z',
        },
      ],
    },
  ],
};

describe('computeWorkoutSessionStats', () => {
  it('sums completed set volume', () => {
    const stats = computeWorkoutSessionStats(baseSession);
    expect(stats.completedSets).toBe(2);
    expect(stats.totalVolumeKg).toBe(960);
    expect(stats.exerciseCount).toBe(1);
  });

  it('counts skipped sets separately', () => {
    const exercise = baseSession.exercises[0];
    const set = exercise?.sets[0];
    if (!exercise || !set) {
      throw new Error('Fixture exercise/set missing');
    }
    const session: WorkoutSessionDetail = {
      ...baseSession,
      exercises: [
        {
          ...exercise,
          sets: [
            {
              ...set,
              isCompleted: false,
              isSkipped: true,
            },
          ],
        },
      ],
    };
    const stats = computeWorkoutSessionStats(session);
    expect(stats.skippedSets).toBe(1);
    expect(stats.completedSets).toBe(0);
  });
});
