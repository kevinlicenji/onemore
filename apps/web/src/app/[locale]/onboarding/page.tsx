'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { OnboardingWizard } from '@/components/onboarding-wizard';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/components/auth-provider';

export default function OnboardingPage(): React.ReactElement {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  useEffect(() => {
    if (!isLoading && profile?.onboardingCompletedAt) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [isLoading, profile?.onboardingCompletedAt, locale, router]);

  return (
    <RequireAuth>
      <OnboardingWizard />
    </RequireAuth>
  );
}
