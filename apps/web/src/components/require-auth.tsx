'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth-provider';

/**
 * Redirects unauthenticated visitors to the login page.
 */
export function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace(`/${locale}/login`);
    }
  }, [accessToken, isLoading, locale, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
