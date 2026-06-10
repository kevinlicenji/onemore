import { afterEach, describe, expect, it } from 'vitest';

import { loadEnv } from './env.js';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('loadEnv', () => {
  it('parses valid environment', () => {
    process.env = {
      NODE_ENV: 'test',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:5432/onemore',
    };

    const env = loadEnv();
    expect(env.API_PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('test');
  });

  it('throws on missing DATABASE_URL', () => {
    process.env = {
      NODE_ENV: 'test',
      API_PORT: '4000',
    };

    expect(() => loadEnv()).toThrow('Invalid environment configuration');
  });
});
