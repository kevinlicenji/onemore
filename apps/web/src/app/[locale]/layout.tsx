import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { AppearanceInitScript } from '@/components/appearance/appearance-init-script';
import { AppearanceProvider } from '@/components/appearance/appearance-provider';
import { AppShellRouter } from '@/components/layout/app-shell-router';
import { ViewportProvider } from '@/components/layout/viewport-provider';
import { AuthProvider } from '@/components/auth-provider';
import { PostHogProvider } from '@/components/posthog-provider';
import { SyncProvider } from '@/components/sync-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { fontVariableClasses } from '@/lib/fonts';

import '../globals.css';

export const metadata: Metadata = {
  title: 'OneMore',
  description: 'Programs, workouts, and progress tracking for athletes.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32.png',
  },
  appleWebApp: { capable: true, title: 'OneMore' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <AppearanceInitScript />
      </head>
      <body className={`${fontVariableClasses} font-sans`}>
        <ThemeProvider>
          <AppearanceProvider>
            <NextIntlClientProvider messages={messages}>
              <PostHogProvider>
                <AuthProvider>
                  <SyncProvider>
                    <ViewportProvider>
                      <AppShellRouter locale={locale}>{children}</AppShellRouter>
                    </ViewportProvider>
                  </SyncProvider>
                </AuthProvider>
              </PostHogProvider>
            </NextIntlClientProvider>
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
