import { afterEach, describe, expect, it, vi } from 'vitest';

import { shouldRegisterServiceWorker } from './push-notifications';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('shouldRegisterServiceWorker', () => {
  it('allows registration in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(shouldRegisterServiceWorker()).toBe(true);
  });

  it('blocks registration outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(shouldRegisterServiceWorker()).toBe(false);
  });
});
