'use client';

import { useAuth } from '@/components/auth-provider';

/**
 * Whether the authenticated user has admin privileges.
 */
export function useIsAdmin(): boolean {
  const { profile } = useAuth();
  return profile?.isAdmin === true;
}
