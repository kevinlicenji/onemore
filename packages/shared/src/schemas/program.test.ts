import { describe, expect, it } from 'vitest';

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

  it('rejects program without exercises', () => {
    expect(() =>
      createProgramSchema.parse({
        name: 'Empty',
        days: [{ label: 'Day A', exercises: [] }],
      }),
    ).toThrow();
  });
});
