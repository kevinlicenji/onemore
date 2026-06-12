'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AuthErrorMessage } from '@/components/auth/auth-error-message';
import { AuthPageContent } from '@/components/auth/auth-page-content';
import { loginWithPassword, useAuth } from '@/components/auth-provider';
import { GymAuthField } from '@/components/gym-ui/gym-auth-field';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { fetchUserProfile, resolveAuthenticatedHomePath } from '@/lib/api-auth';
import { identifyUser } from '@/lib/analytics';

export default function LoginPage(): React.ReactElement {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const { setSession, setProfile } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithPassword(identifier, password);
      setSession(result.accessToken, result.user);
      const profile = await fetchUserProfile(result.accessToken);
      setProfile(profile);
      identifyUser(profile.id);
      router.push(resolveAuthenticatedHomePath(locale, profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdaptivePageShell description={t('loginSubtitle')} title={t('loginTitle')} variant="centered">
      <AuthPageContent
        footer={
          <GymMobileActions>
            <Button asChild variant="outline">
              <Link href={`/${locale}/register`}>{t('goRegister')}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/${locale}/forgot-password`}>{t('goForgotPassword')}</Link>
            </Button>
          </GymMobileActions>
        }
      >
        <form className="flex w-full flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <GymAuthField
            autoComplete="username"
            label={t('loginIdentifier')}
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
            }}
            required
          />
          <GymAuthField
            autoComplete="current-password"
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
          />
          {error ? <AuthErrorMessage message={error} /> : null}
          <Button className="min-h-11 w-full text-base" disabled={loading} type="submit">
            {t('loginSubmit')}
          </Button>
        </form>
      </AuthPageContent>
    </AdaptivePageShell>
  );
}
