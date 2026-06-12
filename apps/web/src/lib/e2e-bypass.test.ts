import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  allowInjectedE2eSession,
  E2E_SESSION_STORAGE_KEY,
  e2eBypassActive,
  isE2ePlaywrightHost,
} from './e2e-bypass';

const originalEnv = process.env.NEXT_PUBLIC_E2E_BYPASS;

function createSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.NEXT_PUBLIC_E2E_BYPASS;
  } else {
    process.env.NEXT_PUBLIC_E2E_BYPASS = originalEnv;
  }
  vi.unstubAllGlobals();
});

describe('allowInjectedE2eSession', () => {
  it('returns false on plain localhost dev without E2E session', () => {
    const sessionStorage = createSessionStorage();
    vi.stubGlobal('window', {
      location: { hostname: 'localhost', port: '3000' },
    } as Window);
    vi.stubGlobal('sessionStorage', sessionStorage);

    expect(allowInjectedE2eSession()).toBe(false);
  });

  it('returns true when Playwright session is in sessionStorage', () => {
    const sessionStorage = createSessionStorage();
    vi.stubGlobal('window', {
      location: { hostname: 'localhost', port: '3000' },
    } as Window);
    vi.stubGlobal('sessionStorage', sessionStorage);
    sessionStorage.setItem(E2E_SESSION_STORAGE_KEY, '{}');

    expect(allowInjectedE2eSession()).toBe(true);
  });

  it('returns true on dedicated Playwright host', () => {
    const sessionStorage = createSessionStorage();
    vi.stubGlobal('window', {
      location: { hostname: '127.0.0.1', port: '3010' },
    } as Window);
    vi.stubGlobal('sessionStorage', sessionStorage);

    expect(isE2ePlaywrightHost()).toBe(true);
    expect(e2eBypassActive()).toBe(true);
    expect(allowInjectedE2eSession()).toBe(true);
  });
});
