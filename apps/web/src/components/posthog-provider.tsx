'use client';

import posthog from 'posthog-js';
import { PostHogProvider as Provider } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { setPostHogClient } from '@/lib/analytics';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

/**
 * Initializes PostHog EU when a public key is configured.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [client, setClient] = useState<typeof posthog | null>(null);

  useEffect(() => {
    if (!POSTHOG_KEY) {
      setPostHogClient(null);
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
    });
    setPostHogClient(posthog);
    setClient(posthog);
  }, []);

  if (!client) {
    return <>{children}</>;
  }

  return <Provider client={client}>{children}</Provider>;
}
