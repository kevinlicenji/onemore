'use client';

import { Button, Card, CardContent, Input } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { loginWithPassword, useAuth } from '@/components/auth-provider';
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
    <AdaptivePageShell title={t('loginTitle')} variant="centered">
      <Card className="w-full">
        <CardContent className="p-6">
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('loginIdentifier')}
              <Input
                autoComplete="username"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                }}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('password')}
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                required
              />
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {t('loginSubmit')}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        <Link href={`/${locale}/register`} className="text-primary hover:underline">
          {t('goRegister')}
        </Link>
        {' · '}
        <Link href={`/${locale}/forgot-password`} className="text-primary hover:underline">
          {t('goForgotPassword')}
        </Link>
      </p>
    </AdaptivePageShell>
  );
}
