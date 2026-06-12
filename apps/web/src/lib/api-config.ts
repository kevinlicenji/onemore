/** Browser fetch base — same-origin `/api/v1` proxy route. */
export const API_BASE_URL = '';

function readNonEmptyEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Server-side proxy target (route handlers, SSR).
 * Uses API_INTERNAL_URL at runtime in Docker (e.g. http://api:4000) — not NEXT_PUBLIC,
 * because NEXT_PUBLIC_* values are inlined at build time and break production deploys.
 */
export const SERVER_API_BASE_URL =
  readNonEmptyEnv('API_INTERNAL_URL') ??
  readNonEmptyEnv('NEXT_PUBLIC_API_URL') ??
  'http://localhost:4000';
