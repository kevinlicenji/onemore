import { describe, expect, it } from 'vitest';

import { shouldAcceptSessionUpdate, shouldAcceptSetLogUpdate } from './sync-merge.js';

describe('sync merge rules', () => {
  it('accepts newer set logs', () => {
    const server = new Date('2026-06-10T10:00:00.000Z');
    const incoming = new Date('2026-06-10T10:00:01.000Z');
    expect(shouldAcceptSetLogUpdate(server, incoming)).toBe(true);
  });

  it('accepts equal timestamps for set logs (server wins ties)', () => {
    const timestamp = new Date('2026-06-10T10:00:00.000Z');
    expect(shouldAcceptSetLogUpdate(timestamp, timestamp)).toBe(true);
  });

  it('rejects older set logs', () => {
    const server = new Date('2026-06-10T10:00:02.000Z');
    const incoming = new Date('2026-06-10T10:00:01.000Z');
    expect(shouldAcceptSetLogUpdate(server, incoming)).toBe(false);
  });

  it('accepts newer session updates', () => {
    const server = new Date('2026-06-10T10:00:00.000Z');
    const incoming = new Date('2026-06-10T10:05:00.000Z');
    expect(shouldAcceptSessionUpdate(server, incoming)).toBe(true);
  });
});
