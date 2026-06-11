import { NextResponse } from 'next/server';

import { API_BASE_URL } from '@/lib/api-config';

/**
 * Proxy refresh token cookie to API and return access token JSON to the client.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const cookie = request.headers.get('cookie') ?? '';
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { cookie },
  });

  const bodyText = await response.text();
  const nextResponse = new NextResponse(bodyText, { status: response.status });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    nextResponse.headers.set('set-cookie', setCookie);
  }

  return nextResponse;
}
