/** Playwright serves the production build on this host/port in CI and locally. */
const E2E_WEB_HOST = '127.0.0.1';
const E2E_WEB_PORT = '3010';

export const E2E_SESSION_STORAGE_KEY = 'onemore_e2e_session';

/**
 * Detect the dedicated Playwright web server without relying on build-time env inlining.
 */
export function isE2ePlaywrightHost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const { hostname, port } = window.location;
  return hostname === E2E_WEB_HOST && port === E2E_WEB_PORT;
}

/**
 * Whether E2E session injection (storage + window hook) is allowed.
 */
export function e2eBypassActive(): boolean {
  return process.env.NEXT_PUBLIC_E2E_BYPASS === 'true' || isE2ePlaywrightHost();
}

/**
 * True when AuthProvider should honour Playwright session injection.
 */
export function allowInjectedE2eSession(): boolean {
  if (typeof window !== 'undefined') {
    if (sessionStorage.getItem(E2E_SESSION_STORAGE_KEY) !== null) {
      return true;
    }
  }
  return e2eBypassActive();
}
