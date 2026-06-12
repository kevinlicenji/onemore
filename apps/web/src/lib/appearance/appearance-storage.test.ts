import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  APPEARANCE_COLOR_THEME_KEY,
  APPEARANCE_FONT_KEY,
  getDefaultAppearancePreferences,
  readAppearancePreferences,
  writeAppearancePreferences,
} from './appearance-storage';

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('appearance storage', () => {
  beforeEach(() => {
    const storage = createStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: storage },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns defaults when storage is empty', () => {
    expect(readAppearancePreferences()).toEqual(getDefaultAppearancePreferences());
  });

  it('persists and reads color theme and font', () => {
    writeAppearancePreferences({ colorThemeId: 'midnight', fontId: 'inter' });
    expect(localStorage.getItem(APPEARANCE_COLOR_THEME_KEY)).toBe('midnight');
    expect(localStorage.getItem(APPEARANCE_FONT_KEY)).toBe('inter');
    expect(readAppearancePreferences()).toEqual({ colorThemeId: 'midnight', fontId: 'inter' });
  });
});
