import { describe, expect, it } from 'vitest';

import { formatDisplayName, pickVariantIndex, resolveGreetingName } from './person-name.js';

describe('formatDisplayName', () => {
  it('joins first and last name', () => {
    expect(formatDisplayName('Kevin', 'Licenji')).toBe('Kevin Licenji');
  });

  it('returns null when both names are empty', () => {
    expect(formatDisplayName(null, '  ')).toBeNull();
  });
});

describe('resolveGreetingName', () => {
  it('prefers firstName over displayName', () => {
    expect(resolveGreetingName({ firstName: 'Kevin', displayName: 'Kevin Licenji' })).toBe('Kevin');
  });

  it('falls back to first word of displayName', () => {
    expect(resolveGreetingName({ firstName: null, displayName: 'Marco Rossi' })).toBe('Marco');
  });
});

describe('pickVariantIndex', () => {
  it('returns stable index for the same seed', () => {
    expect(pickVariantIndex('user-123-dashboard', 4)).toBe(
      pickVariantIndex('user-123-dashboard', 4),
    );
  });

  it('stays within variant count', () => {
    expect(pickVariantIndex('seed', 5)).toBeGreaterThanOrEqual(0);
    expect(pickVariantIndex('seed', 5)).toBeLessThan(5);
  });
});
