import { afterEach, describe, expect, it, vi } from 'vitest';

describe('api-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('prefers API_INTERNAL_URL for server-side proxy', async () => {
    vi.stubEnv('API_INTERNAL_URL', 'http://api:4000');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    const { SERVER_API_BASE_URL } = await import('./api-config');
    expect(SERVER_API_BASE_URL).toBe('http://api:4000');
  });

  it('falls back to NEXT_PUBLIC_API_URL when internal URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    const { SERVER_API_BASE_URL } = await import('./api-config');
    expect(SERVER_API_BASE_URL).toBe('https://api.example.com');
  });

  it('defaults to localhost for local development', async () => {
    const { SERVER_API_BASE_URL } = await import('./api-config');
    expect(SERVER_API_BASE_URL).toBe('http://localhost:4000');
  });
});
