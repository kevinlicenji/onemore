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
   * GET JSON from an API path.
   *
   * @param path - Path relative to base URL (e.g. `/api/v1/programs`).
   * @returns Parsed JSON body.
   * @throws When the response is not OK.
   */
  async getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new Error(`GET ${path} failed: ${String(response.status)}`);
    }
    return response.json() as Promise<T>;
  }

  /**
   * POST JSON to an API path.
   *
   * @param path - Path relative to base URL.
   * @param body - JSON-serializable payload.
   * @returns Parsed JSON body.
   * @throws When the response is not OK.
   */
  async putJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`PUT ${path} failed: ${String(response.status)}`);
    }
    return response.json() as Promise<T>;
  }

  async postJson<T>(
    path: string,
    body: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const headers = this.buildHeaders();
    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        headers.set(key, value);
      }
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`POST ${path} failed: ${String(response.status)}`);
    }
    return response.json() as Promise<T>;
  }

  /**
   * DELETE request to an API path.
   *
   * @param path - Path relative to base URL.
   * @returns Parsed JSON body (or void for 204).
   * @throws When the response is not OK.
   */
  async deleteJson<T = void>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new Error(`DELETE ${path} failed: ${String(response.status)}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
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
