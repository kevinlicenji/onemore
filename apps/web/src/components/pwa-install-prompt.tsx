'use client';

import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Surfaces the browser PWA install prompt on supported devices.
 */
export function PwaInstallPrompt(): React.ReactElement | null {
  const t = useTranslations('Pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const dismissedKey = 'onemore_pwa_install_dismissed';
    if (window.localStorage.getItem(dismissedKey) === '1') {
      setDismissed(true);
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

  if (dismissed || deferredPrompt === null) {
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
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium">{t('installTitle')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('installBody')}</p>
      <div className="mt-3 flex gap-2">
        <Button
          className="min-h-11 flex-1"
          size="sm"
          type="button"
          onClick={() => void handleInstall()}
        >
          {t('installCta')}
        </Button>
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
