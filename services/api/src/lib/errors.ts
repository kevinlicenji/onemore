/**
 * HTTP error with status code and machine-readable code for API responses.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  /**
   * @param statusCode - HTTP status.
   * @param message - Human-readable message.
   * @param code - Stable error code for clients.
   */
  constructor(statusCode: number, message: string, code: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
