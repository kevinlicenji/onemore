import { healthResponseSchema, type HealthResponse } from '@onemore/shared';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
}

/**
 * Typed REST client for OneMore API v1.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => string | null;

  /**
   * @param options - Base URL and optional auth token provider.
   */
  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getAccessToken = options.getAccessToken;
  }

  /**
   * Fetch API health status.
   *
   * @returns Parsed health response.
   * @throws When the response is not OK or fails schema validation.
   */
  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${String(response.status)}`);
    }
    const json: unknown = await response.json();
    return healthResponseSchema.parse(json);
  }

  /**
   * Build request headers including optional Bearer token.
   *
   * @returns Headers for API requests.
   */
  private buildHeaders(): Headers {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = this.getAccessToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
