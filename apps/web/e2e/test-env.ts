/** Fixed E2E ports — avoid clashing with local dev on 3000/4000. */
export const E2E_API_PORT = '4010';
export const E2E_WEB_PORT = '3010';
export const E2E_API_URL = `http://127.0.0.1:${E2E_API_PORT}`;
export const E2E_WEB_URL = `http://127.0.0.1:${E2E_WEB_PORT}`;
