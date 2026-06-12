'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth-provider';
import { resolveAuthenticatedHomePath } from '@/lib/api-auth';

/**
 * Redirects authenticated users away from the public landing page.
 */
export function HomeRedirect(): null {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace(resolveAuthenticatedHomePath(locale, profile));
    }
  }, [isLoading, profile, locale, router]);

  return null;
}
