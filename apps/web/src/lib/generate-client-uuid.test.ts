import { describe, expect, it } from 'vitest';

import { generateClientUuid } from './generate-client-uuid';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateClientUuid', () => {
  it('returns a valid v4 UUID string', () => {
    expect(generateClientUuid()).toMatch(UUID_V4_PATTERN);
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateClientUuid()));
    expect(ids.size).toBe(20);
  });

  it('falls back when crypto.randomUUID is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (array: Uint8Array): Uint8Array => {
          for (let index = 0; index < array.length; index += 1) {
            array[index] = index;
          }
          return array;
        },
      },
    });

    try {
      expect(generateClientUuid()).toMatch(UUID_V4_PATTERN);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      });
    }
  });
});
