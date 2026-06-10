import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from './client.js';

describe('ApiClient', () => {
  it('parses health response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          timestamp: '2026-06-10T12:00:00.000Z',
          version: '0.1.0',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
    const health = await client.getHealth();

    expect(health.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/health');
  });

  it('throws on failed health check', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
    await expect(client.getHealth()).rejects.toThrow('Health check failed');
  });
});
