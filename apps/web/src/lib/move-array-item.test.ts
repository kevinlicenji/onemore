import { describe, expect, it } from 'vitest';

import { moveArrayItem } from './move-array-item';

describe('moveArrayItem', () => {
  it('moves an item forward', () => {
    expect(moveArrayItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item backward', () => {
    expect(moveArrayItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns the same array for invalid indices', () => {
    const source = ['a', 'b'];
    expect(moveArrayItem(source, 0, 0)).toBe(source);
    expect(moveArrayItem(source, -1, 1)).toBe(source);
    expect(moveArrayItem(source, 0, 5)).toBe(source);
  });
});
