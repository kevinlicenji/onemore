const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Browser calls use same-origin `/api/v1/*` (rewritten to the API in next.config).
 * Server routes and SSR use the configured API origin directly.
 */
export const API_BASE_URL = typeof window === 'undefined' ? configuredApiUrl : '';
