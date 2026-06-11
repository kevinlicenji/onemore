/** Fixed E2E ports — avoid clashing with local dev on 3000/4000. */
export const E2E_API_PORT = '4010';
export const E2E_WEB_PORT = '3010';
export const E2E_API_URL = `http://127.0.0.1:${E2E_API_PORT}`;
export const E2E_WEB_URL = `http://127.0.0.1:${E2E_WEB_PORT}`;

/** Must match `E2E_SESSION_STORAGE_KEY` in `src/lib/e2e-bypass.ts`. */
export const E2E_SESSION_STORAGE_KEY = 'onemore_e2e_session';
