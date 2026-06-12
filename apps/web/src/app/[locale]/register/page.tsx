'use client';

import { registerBodySchema } from '@onemore/shared';
import { Button, Card, CardContent, Input } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ZodError } from 'zod';

import { registerAccount, useAuth } from '@/components/auth-provider';
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
    <AdaptivePageShell title={t('registerTitle')} variant="centered">
      <Card className="w-full">
        <CardContent className="p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('email')}
              <Input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('username')}
              <Input
                autoComplete="username"
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
              <span className="text-xs font-normal text-muted-foreground">{t('usernameHint')}</span>
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
                minLength={8}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('birthYear')}
              <Input
                type="number"
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(Number(e.target.value));
                }}
                required
              />
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {t('registerSubmit')}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Link className="text-center text-sm text-primary hover:underline" href={`/${locale}/login`}>
        {t('goLogin')}
      </Link>
    </AdaptivePageShell>
  );
}
