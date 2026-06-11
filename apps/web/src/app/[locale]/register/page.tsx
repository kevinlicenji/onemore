'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { registerAccount, useAuth } from '@/components/auth-provider';
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
      const result = await registerAccount({
        email,
        password,
        username,
        locale,
        birthYear,
        timezone: 'Europe/Rome',
        consents: { tos: true, privacy: true, fitnessData: true },
      });
      setSession(result.accessToken, result.user);
      const profile = await fetchUserProfile(result.accessToken);
      setProfile(profile);
      identifyUser(profile.id);
      router.push(resolveAuthenticatedHomePath(locale, profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('registerTitle')}</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          {t('email')}
          <input
            className="rounded-md border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('username')}
          <input
            className="rounded-md border px-3 py-2"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('password')}
          <input
            className="rounded-md border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
            minLength={8}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('birthYear')}
          <input
            className="rounded-md border px-3 py-2"
            type="number"
            value={birthYear}
            onChange={(e) => {
              setBirthYear(Number(e.target.value));
            }}
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {t('registerSubmit')}
        </Button>
      </form>
      <Link className="text-sm" href={`/${locale}/login`}>
        {t('goLogin')}
      </Link>
    </main>
  );
}
