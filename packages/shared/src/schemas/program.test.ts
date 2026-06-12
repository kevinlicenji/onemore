import { describe, expect, it } from 'vitest';

import { TARGET_REPS_TO_FAILURE } from '../constants/reps-prescription.js';
import { createProgramSchema } from './program.js';

describe('createProgramSchema', () => {
  it('accepts a minimal valid program', () => {
    const result = createProgramSchema.parse({
      name: 'My program',
      days: [
        {
          label: 'Day A',
          exercises: [
            {
              exerciseLibraryId: '00000000-0000-4000-8000-000000000001',
              targetSets: 3,
              targetReps: 8,
              restSeconds: 90,
            },
          ],
        },
      ],
    });
    expect(result.days.length).toBe(1);
  });

  it('accepts failure reps prescription', () => {
    const result = createProgramSchema.parse({
      name: 'Failure day',
      days: [
        {
          label: 'Day A',
          exercises: [
            {
              exerciseLibraryId: '00000000-0000-4000-8000-000000000001',
              targetSets: 3,
              targetReps: TARGET_REPS_TO_FAILURE,
              restSeconds: 120,
            },
          ],
        },
      ],
    });
    expect(result.days[0]?.exercises[0]?.targetReps).toBe(TARGET_REPS_TO_FAILURE);
  });

  it('accepts time-based reps used by seeded templates', () => {
    const result = createProgramSchema.parse({
      name: 'Core day',
      days: [
        {
          label: 'Day A',
          exercises: [
            {
              exerciseLibraryId: '00000000-0000-4000-8000-000000000001',
              targetSets: 3,
              targetReps: 30,
              restSeconds: 60,
            },
          ],
        },
      ],
    });
    expect(result.days[0]?.exercises[0]?.targetReps).toBe(30);
  });

  it('rejects program without exercises', () => {
    expect(() =>
      createProgramSchema.parse({
        name: 'Empty',
        days: [{ label: 'Day A', exercises: [] }],
      }),
    ).toThrow();
  });
});
