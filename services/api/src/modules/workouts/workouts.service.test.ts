import { describe, expect, it, vi } from 'vitest';

import { PrDetectionService } from '../progress/pr-detection.service.js';
import { WorkoutsService } from './workouts.service.js';

function createMockPrisma() {
  return {
    programAssignment: {
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
    workoutSession: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      findUnique: vi.fn(() => Promise.resolve(null)),
    },
    programExercise: {
      count: vi.fn(() => Promise.resolve(0)),
    },
  };
}

describe('WorkoutsService', () => {
  it('returns empty next workout when no assignment exists', async () => {
    const prisma = createMockPrisma();
    const service = new WorkoutsService(prisma as never, new PrDetectionService());

    const preview = await service.getNextWorkoutPreview('user-1');

    expect(preview.hasActiveAssignment).toBe(false);
    expect(preview.workoutDayId).toBeNull();
    expect(preview.days).toEqual([]);
  });

  it('returns null when no active session exists', async () => {
    const prisma = createMockPrisma();
    const service = new WorkoutsService(prisma as never, new PrDetectionService());

    const session = await service.getActiveSession('user-1');

    expect(session).toBeNull();
  });
});
