'use client';

import { Button, Card, CardContent, Input } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
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
    <AdaptivePageShell title={t('forgotTitle')} variant="centered">
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">{t('forgotSuccess')}</p>
      ) : (
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
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  required
                />
              </label>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full">
                {t('forgotSubmit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Link className="text-center text-sm text-primary hover:underline" href={`/${locale}/login`}>
        {t('goLogin')}
      </Link>
    </AdaptivePageShell>
  );
}
