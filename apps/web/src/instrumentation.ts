/**
 * Next.js instrumentation hook. Sentry loads only when a DSN is configured.
 */
export async function register(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  await import('../sentry.server.config');
}

type RequestErrorHandler = (
  error: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
  },
) => void | Promise<void>;

export const onRequestError: RequestErrorHandler = async (error, request, context) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  const Sentry = await import('@sentry/nextjs');
  await Sentry.captureRequestError(error, request, context);
};
