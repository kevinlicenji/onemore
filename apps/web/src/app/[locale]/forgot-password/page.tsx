'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { API_BASE_URL } from '@/lib/api-config';

export default function ForgotPasswordPage(): React.ReactElement {
  const t = useTranslations('Auth');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      setError(t('forgotError'));
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('forgotTitle')}</h1>
      {sent ? (
        <p className="text-sm text-muted-foreground">{t('forgotSuccess')}</p>
      ) : (
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">{t('forgotSubmit')}</Button>
        </form>
      )}
      <Link className="text-sm" href={`/${locale}/login`}>
        {t('goLogin')}
      </Link>
    </main>
  );
}
