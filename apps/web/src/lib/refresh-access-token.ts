export interface RefreshedAuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    locale: string;
  };
}

/**
 * Refresh the in-memory access token using the httpOnly refresh cookie proxy.
 */
export async function refreshAccessToken(): Promise<RefreshedAuthSession | null> {
  const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<RefreshedAuthSession>;
}

/**
 * Detect expired access tokens surfaced by the API client.
 */
export function isInvalidAccessTokenError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Invalid access token');
}
