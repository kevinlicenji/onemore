import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Never cache same-origin API traffic — auth headers are not part of the cache key,
 * so cached 401 responses break login until the service worker is cleared.
 */
const apiNetworkOnly = {
  matcher: ({ sameOrigin, url: { pathname } }: { sameOrigin: boolean; url: URL }) =>
    sameOrigin && pathname.startsWith('/api/'),
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiNetworkOnly, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/it/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

function parsePushPayload(event: PushEvent): PushPayload {
  if (!event.data) {
    return {};
  }
  try {
    const parsed: unknown = event.data.json();
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const record = parsed as Record<string, unknown>;
    return {
      title: typeof record.title === 'string' ? record.title : undefined,
      body: typeof record.body === 'string' ? record.body : undefined,
      url: typeof record.url === 'string' ? record.url : undefined,
    };
  } catch {
    return {};
  }
}

self.addEventListener('push', (event: PushEvent) => {
  const payload = parsePushPayload(event);
  const title = payload.title ?? 'OneMore';
  const body = payload.body ?? '';
  const url = payload.url ?? '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | undefined;
  const targetUrl = data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          void client.focus();
          return;
        }
      }
      void self.clients.openWindow(targetUrl);
    }),
  );
});
