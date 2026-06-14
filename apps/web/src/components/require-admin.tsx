'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth-provider';
import { useIsAdmin } from '@/hooks/use-is-admin';

/**
 * Redirects non-admin visitors away from admin routes.
 */
export function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const { accessToken, isLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace(`/${locale}/login`);
      return;
    }
    if (!isLoading && accessToken && !isAdmin) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [accessToken, isAdmin, isLoading, locale, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!accessToken || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
