'use client';

import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useIsDesktop } from '@/hooks/use-is-desktop';
import { isIosSafari, isStandalonePwa } from '@/lib/pwa-platform';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Surfaces PWA install guidance on supported devices (Android prompt or iOS steps).
 */
export function PwaInstallPrompt(): React.ReactElement | null {
  const t = useTranslations('Pwa');
  const isDesktop = useIsDesktop();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalonePwa()) {
      return;
    }

    const dismissedKey = 'onemore_pwa_install_dismissed';
    if (window.localStorage.getItem(dismissedKey) === '1') {
      setDismissed(true);
      return;
    }

    if (isIosSafari()) {
      setShowIosGuide(true);
      return;
    }

    function handleBeforeInstall(event: Event): void {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (dismissed || isDesktop) {
    return null;
  }

  if (!showIosGuide && deferredPrompt === null) {
    return null;
  }

  async function handleInstall(): Promise<void> {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'dismissed') {
      window.localStorage.setItem('onemore_pwa_install_dismissed', '1');
      setDismissed(true);
    }
  }

  function handleDismiss(): void {
    window.localStorage.setItem('onemore_pwa_install_dismissed', '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosGuide(false);
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium">{t('installTitle')}</p>
      {showIosGuide ? (
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
          <li>{t('iosStepShare')}</li>
          <li>{t('iosStepAdd')}</li>
        </ol>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{t('installBody')}</p>
      )}
      <div className="mt-3 flex gap-2">
        {!showIosGuide ? (
          <Button
            className="min-h-11 flex-1"
            size="sm"
            type="button"
            onClick={() => {
              void handleInstall();
            }}
          >
            {t('installCta')}
          </Button>
        ) : null}
        <Button
          className="min-h-11"
          size="sm"
          type="button"
          variant="ghost"
          onClick={handleDismiss}
        >
          {t('installDismiss')}
        </Button>
      </div>
    </div>
  );
}
