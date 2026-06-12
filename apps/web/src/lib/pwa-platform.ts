/**
 * @returns True when running on iPhone/iPad Safari (not standalone).
 */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isStandalone =
    'standalone' in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

/**
 * @returns True when the app is already installed to the home screen.
 */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}
