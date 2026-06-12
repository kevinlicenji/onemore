'use client';

import { registerBodySchema } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ZodError } from 'zod';

import { AuthErrorMessage } from '@/components/auth/auth-error-message';
import { AuthPageContent } from '@/components/auth/auth-page-content';
import { registerAccount, useAuth } from '@/components/auth-provider';
import { GymAuthField } from '@/components/gym-ui/gym-auth-field';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { fetchUserProfile, resolveAuthenticatedHomePath } from '@/lib/api-auth';
import { identifyUser } from '@/lib/analytics';

export default function RegisterPage(): React.ReactElement {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const { setSession, setProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [birthYear, setBirthYear] = useState(1995);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = registerBodySchema.parse({
        email,
        password,
        username,
        locale,
        birthYear,
        timezone: 'Europe/Rome',
        consents: { tos: true, privacy: true, fitnessData: true },
      });
      const result = await registerAccount(payload);
      setSession(result.accessToken, result.user);
      const profile = await fetchUserProfile(result.accessToken);
      setProfile(profile);
      identifyUser(profile.id);
      router.push(resolveAuthenticatedHomePath(locale, profile));
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0]?.message ?? t('registerError'));
      } else {
        setError(err instanceof Error ? err.message : t('registerError'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdaptivePageShell
      backHref={`/${locale}/login`}
      backLabel={t('goLogin')}
      description={t('registerSubtitle')}
      title={t('registerTitle')}
      variant="centered"
    >
      <AuthPageContent
        footer={
          <GymMobileActions>
            <Button asChild variant="outline">
              <Link href={`/${locale}/login`}>{t('goLogin')}</Link>
            </Button>
          </GymMobileActions>
        }
      >
        <form
          className="flex w-full flex-col gap-4"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <GymAuthField
            autoComplete="email"
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
          <GymAuthField
            autoComplete="username"
            hint={t('usernameHint')}
            label={t('username')}
            maxLength={30}
            minLength={3}
            pattern="[A-Za-z0-9_]{3,30}"
            title={t('usernameHint')}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.replace(/@/g, ''));
            }}
            required
          />
          <GymAuthField
            autoComplete="new-password"
            label={t('password')}
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
          />
          <GymAuthField
            inputMode="numeric"
            label={t('birthYear')}
            max={new Date().getFullYear()}
            min={1920}
            type="number"
            value={birthYear}
            onChange={(e) => {
              setBirthYear(Number(e.target.value));
            }}
            required
          />
          {error ? <AuthErrorMessage message={error} /> : null}
          <Button className="min-h-11 w-full text-base" disabled={loading} type="submit">
            {t('registerSubmit')}
          </Button>
        </form>
      </AuthPageContent>
    </AdaptivePageShell>
  );
}
