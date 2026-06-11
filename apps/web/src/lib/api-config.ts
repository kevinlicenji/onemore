/** Browser fetch base — same-origin `/api/v1` proxy route. */
export const API_BASE_URL = '';

/** Server-side proxy targets (route handlers, SSR). */
export const SERVER_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
