import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { AppShell } from '@/components/app-shell';
import { AuthProvider } from '@/components/auth-provider';
import { PostHogProvider } from '@/components/posthog-provider';
import { SyncProvider } from '@/components/sync-provider';
import { routing } from '@/i18n/routing';

import '../globals.css';

export const metadata: Metadata = {
  title: 'OneMore',
  description: 'Programs, workouts, and progress tracking for athletes.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'OneMore' },
  themeColor: '#3b82f6',
};

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'it' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            <AuthProvider>
              <SyncProvider>
                <AppShell locale={locale}>{children}</AppShell>
              </SyncProvider>
            </AuthProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
