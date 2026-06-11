import { describe, expect, it, vi } from 'vitest';

import { GdprExportService } from './gdpr-export.service.js';

describe('GdprExportService', () => {
  it('rejects export when a recent job exists', async () => {
    const prisma = {
      dataExportJob: {
        findFirst: vi.fn(() => Promise.resolve({ id: 'job-1' })),
        create: vi.fn(),
      },
    };

    const env = {
      EXPORT_STORAGE_PATH: './data/exports',
      API_PUBLIC_URL: 'http://localhost:4000',
    };

    const service = new GdprExportService(
      prisma as never,
      env as never,
      { send: vi.fn() } as never,
      { info: vi.fn(), error: vi.fn() } as never,
    );

    await expect(service.requestExport('user-1')).rejects.toThrow('Export already requested');
  });
});
