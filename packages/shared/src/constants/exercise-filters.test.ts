import { describe, expect, it } from 'vitest';

import { equipmentTypesForGroup } from './exercise-filters.js';

describe('exercise-filters', () => {
  it('maps machine group to machine equipment slugs', () => {
    expect(equipmentTypesForGroup('machines')).toEqual(['machine', 'smith_machine']);
  });

  it('maps bodyweight group to bodyweight equipment slugs', () => {
    expect(equipmentTypesForGroup('bodyweight')).toContain('bodyweight');
  });
});
